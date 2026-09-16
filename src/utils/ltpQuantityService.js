// Leitura do acumulado semanal de "Qtty LTP" (VD e DA) — a gravação é 100%
// feita pelo cron do Postgres (ver supabase/migrations/ltp_quantity_snapshots.sql),
// o app aqui só soma os snapshots diários já persistidos.
import { supabase } from "../lib/supabaseClient";

// Semana domingo→sábado. Em JS, Date.getDay() já retorna 0 para domingo, então
// não precisa do ajuste que weeklyRtat.js faz pra semana começando na segunda.
function weekStartSunday(now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/**
 * Soma os snapshots diários (vd_count/da_count) da semana corrente
 * (domingo até hoje) pra uma unidade. Retorna também o detalhe por dia, útil
 * pro mini gráfico e pra avisar se algum dia ficou sem captura.
 */
export async function getWeekAccumulated(tableName) {
  const start = weekStartSunday();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("ltp_quantity_snapshots")
    .select("snapshot_date, vd_count, da_count")
    .eq("table_name", tableName)
    .gte("snapshot_date", toDateKey(start))
    .lte("snapshot_date", toDateKey(today))
    .order("snapshot_date", { ascending: true });

  if (error) throw error;

  const rows = data || [];
  const byDate = new Map(rows.map((r) => [r.snapshot_date, r]));

  // Monta os 7 dias da semana (dom..sáb até hoje), preenchendo com null os
  // dias ainda sem captura — assim o gráfico mostra o buraco em vez de sumir.
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (d > today) break;
    const key = toDateKey(d);
    const row = byDate.get(key);
    days.push({
      date: key,
      label: WEEKDAY_LABELS[d.getDay()],
      vd: row ? row.vd_count : null,
      da: row ? row.da_count : null,
      isToday: key === toDateKey(today),
    });
  }

  const vd = rows.reduce((sum, r) => sum + (r.vd_count || 0), 0);
  const da = rows.reduce((sum, r) => sum + (r.da_count || 0), 0);

  return {
    vd,
    da,
    days,
    daysCaptured: rows.length,
    daysExpected: days.length,
    weekStart: toDateKey(start),
  };
}
