-- Histórico de métricas por unidade/tabela (snapshots do dashboard ao longo do
-- tempo). Alimenta o gráfico "Evolução no Tempo" (TrendCharts) e a barra de
-- "Comparar Evolução". Um snapshot é gravado a cada mudança dos indicadores
-- (dedup no frontend), agrupado por `table_name` (a unidade selecionada).
--
-- IDEMPOTENTE E ADITIVO: a tabela pode já existir com um schema antigo/incompleto
-- (foi o caso — faltava `table_name`, fazendo todo INSERT falhar em silêncio).
-- Por isso criamos o mínimo e depois garantimos CADA coluna com
-- ADD COLUMN IF NOT EXISTS, sem apagar nada que já esteja lá.

CREATE TABLE IF NOT EXISTS public.asc_metrics_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garante todas as colunas que o app grava (nomes exatos usados no insert do
-- HomePage.jsx). Nullable de propósito, para não quebrar em linhas já existentes.
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS table_name TEXT;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS quantity_ltp_vd INTEGER DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS quantity_ex_ltp_vd INTEGER DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS in_route INTEGER DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS quantity_ltp_rac_ref INTEGER DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS quantity_ex_ltp_rac_ref INTEGER DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS quantity_ltp_wsm INTEGER DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS quantity_ltp_vd_ci INTEGER DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS quantity_ltp_mx_ci INTEGER DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS quantity_ftf INTEGER DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS quantity_da INTEGER DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS quantity_lp_up_to_3_days INTEGER DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS quantity_all_outdated_orders INTEGER DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS quantity_all_da_ow INTEGER DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS quantity_da_noparts INTEGER DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS quantity_oudated_ih INTEGER DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS quantity_oudated_repair_complete_ih INTEGER DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS quantity_complete_ci_lp INTEGER DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS quantity_complete_ci_ow_x09 INTEGER DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS quantity_complete_ci_ow_not_x09 INTEGER DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS quantity_potential_first_visit INTEGER DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS quantity_agenda_today INTEGER DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS quantity_agenda_tomorrow INTEGER DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS average NUMERIC DEFAULT 0;
ALTER TABLE public.asc_metrics_history ADD COLUMN IF NOT EXISTS average2 NUMERIC DEFAULT 0;

-- Consulta principal: por unidade, ordenado no tempo.
CREATE INDEX IF NOT EXISTS idx_asc_metrics_history_table_created
    ON public.asc_metrics_history (table_name, created_at);

-- RLS liberado para o app (anon) ler e gravar.
ALTER TABLE public.asc_metrics_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for asc_metrics_history" ON public.asc_metrics_history;
CREATE POLICY "Enable all for asc_metrics_history" ON public.asc_metrics_history
    FOR ALL USING (true) WITH CHECK (true);
