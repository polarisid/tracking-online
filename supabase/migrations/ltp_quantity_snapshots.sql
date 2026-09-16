-- Qtty LTP acumulada da semana (VD e DA), capturada sozinha às 16h (América/São
-- Paulo) via pg_cron — o app não roda nenhum processo de servidor por conta
-- própria, então o "horário de corte" só pode ser garantido de dentro do banco.
--
-- Mecânica: todo dia às 16h, a function `capture_ltp_snapshot()` conta quantas
-- OS estão em LTP (VD e DA) em cada unidade, e grava 1 linha por
-- (unidade, dia). O front-end só LÊ esta tabela e soma os dias da semana
-- corrente (domingo→sábado) — a soma intencionalmente NÃO deduplica ordens
-- repetidas entre dias (ex: 3 hoje + 5 amanhã = 8 acumulado).
--
-- Definição de LTP replicada de src/utils/filters.js (nenhum desses filtros
-- exclui ST035 — o acumulado bate com "LTP VD IH"/"Todos DA LP" do dashboard):
--   LTP VD = in_out_warranty_flag='LP' + service_type='IH' + service_product_code
--            em AV_CODES + pending_aging_days > 6           (filter_VD_LTP_LP)
--   LTP DA = (RAC_CODES∪REF_CODES + pending_aging_days > 4)  (filter_REF_RAC_LTP_LP)
--            OU (SWM_CODES∪HKE_CODE + pending_aging_days > 6) (filter_WSM_LP_LTP)
--
-- IDEMPOTENTE E ADITIVO (mesma convenção de asc_metrics_history.sql):
-- CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS, re-executável.

CREATE TABLE IF NOT EXISTS public.ltp_quantity_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ltp_quantity_snapshots ADD COLUMN IF NOT EXISTS table_name TEXT;
ALTER TABLE public.ltp_quantity_snapshots ADD COLUMN IF NOT EXISTS snapshot_date DATE;
ALTER TABLE public.ltp_quantity_snapshots ADD COLUMN IF NOT EXISTS vd_count INTEGER DEFAULT 0;
ALTER TABLE public.ltp_quantity_snapshots ADD COLUMN IF NOT EXISTS da_count INTEGER DEFAULT 0;
ALTER TABLE public.ltp_quantity_snapshots ADD COLUMN IF NOT EXISTS captured_at TIMESTAMP WITH TIME ZONE;

-- Chave do upsert: 1 linha por (unidade, dia). Rodar a function de novo no
-- mesmo dia atualiza o valor em vez de duplicar.
CREATE UNIQUE INDEX IF NOT EXISTS idx_ltp_quantity_snapshots_unit_day
    ON public.ltp_quantity_snapshots (table_name, snapshot_date);

-- RLS: o app só precisa LER (a gravação é sempre via SECURITY DEFINER da
-- function, rodando com privilégio do dono, nunca como anon).
ALTER TABLE public.ltp_quantity_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for ltp_quantity_snapshots" ON public.ltp_quantity_snapshots;
CREATE POLICY "Enable read for ltp_quantity_snapshots" ON public.ltp_quantity_snapshots
    FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- Function de captura — conta LTP VD/DA em cada unidade e grava o snapshot do
-- dia. SECURITY DEFINER pra poder gravar mesmo sem policy de INSERT pro anon.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.capture_ltp_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    -- Mesma lista fixa de unidades de DEFAULT_TABLES em src/Contexts/HomeContext.jsx.
    -- Se uma 4ª unidade for cadastrada no app, precisa atualizar aqui também.
    unit_tables TEXT[] := ARRAY['asc_0003198122', 'asc_0005286953', 'asc_0003886546'];
    tbl TEXT;
    today_brt DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
    vd_count INTEGER;
    da_count INTEGER;

    av_codes TEXT[] := ARRAY['CTV99','DTV02','LED01','LED02','LED03','LED85','LTV01','LTV02','LTV99','PDP01','AUD01','AUD04',
        'AUD05','AUD06','AUD99','BDP01','BTV01','CTV01','CTV02','CTV97','CTV98','CTV99','DLB01','DPT01','DTV01','DTV02','DVD01',
        'DVD02','DVD04','DVD05','DVD06','HTS01','HTS02','HTS03','HTS99','HTV01','HTV02','LDI01','LDI02','LED01','LED02','LED03',
        'LED85','LPF07','LPF08','LPF10','LTV01','LTV02','LTV99','MON01','MOT01','MST01','PDM01','PDP01','PDP02','PJM01','PJM99',
        'PJT01','TFT01','TFT02','WTV01','PDP02','WTV01','LED01','LED02','LED03','LFD01','LFD02','HTS01','PJT01','TFT01',
        'TFT02','PJT01'];
    rac_codes TEXT[] := ARRAY['FJM01','CAC01','CAC06','RAC01','RAC02','RAC03','RAM01','RAO01','RAS01','RAW01','SAC01','SAC02','SAC04','RAO02','RAO01'];
    ref_codes TEXT[] := ARRAY['REF01','REF99','SBS01','SWC01'];
    swm_codes TEXT[] := ARRAY['SWM01','SWM02','SWM03','SWM99','SWD01','SWD02','SWD03','SWD99'];
    hke_codes TEXT[] := ARRAY['GCT01','SEO01','SHD01','ZHA09'];
BEGIN
    FOREACH tbl IN ARRAY unit_tables LOOP
        BEGIN
            EXECUTE format(
                $q$
                SELECT
                    count(*) FILTER (
                        WHERE in_out_warranty_flag = 'LP'
                          AND service_type = 'IH'
                          AND service_product_code = ANY(%L)
                          AND aging > 6
                    ),
                    count(*) FILTER (
                        WHERE in_out_warranty_flag = 'LP'
                          AND service_type = 'IH'
                          AND (
                            (service_product_code = ANY(%L) AND aging > 4)
                            OR (service_product_code = ANY(%L) AND aging > 6)
                          )
                    )
                FROM (
                    SELECT *, COALESCE(NULLIF(pending_aging_days, '')::numeric, 0) AS aging
                    FROM public.%I
                    WHERE removido_em IS NULL
                ) t
                $q$,
                av_codes,
                (rac_codes || ref_codes),
                (swm_codes || hke_codes),
                tbl
            ) INTO vd_count, da_count;

            INSERT INTO public.ltp_quantity_snapshots (table_name, snapshot_date, vd_count, da_count, captured_at)
            VALUES (tbl, today_brt, vd_count, da_count, now())
            ON CONFLICT (table_name, snapshot_date)
            DO UPDATE SET vd_count = EXCLUDED.vd_count, da_count = EXCLUDED.da_count, captured_at = now();
        EXCEPTION WHEN undefined_table THEN
            -- Unidade da lista fixa ainda não existe como tabela no banco — pula.
            CONTINUE;
        END;
    END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Agendamento: todo dia às 16h de Brasília = 19h UTC (Brasil é UTC-3 fixo
-- desde 2019, sem horário de verão — não precisa ajuste sazonal).
-- Se `CREATE EXTENSION` falhar por permissão, habilite "pg_cron" em
-- Database > Extensions no dashboard do Supabase e rode este arquivo de novo.
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'capture-ltp-1600-brt') THEN
        PERFORM cron.schedule('capture-ltp-1600-brt', '0 19 * * *', 'SELECT public.capture_ltp_snapshot();');
    END IF;
END;
$$;
