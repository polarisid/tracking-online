import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Layers } from "lucide-react";

const PRIMARY = "#6366f1";   // indigo-500 — LTP VD (mesma primária do app)
const SECONDARY = "#f59e0b"; // amber-500 — LTP DA (distinta da primária)
const TODAY_STROKE = "#1e293b"; // slate-800 — mesmo destaque de "selecionado" usado em DashboardCharts

const tooltipStyle = {
  borderRadius: "8px",
  border: "none",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
  fontSize: 12,
};

function BigNumber({ label, value, color }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-extrabold leading-tight mt-1" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="h-2.5 w-20 bg-slate-200 rounded-full" />
          <div className="h-7 w-14 bg-slate-200 rounded-md" />
        </div>
        <div className="space-y-2">
          <div className="h-2.5 w-20 bg-slate-200 rounded-full" />
          <div className="h-7 w-14 bg-slate-200 rounded-md" />
        </div>
      </div>
      <div className="h-[160px] bg-slate-100 rounded-lg" />
    </div>
  );
}

/**
 * Qtty LTP acumulado da semana (domingo → hoje), VD e DA.
 * Componente de apresentação puro — a busca dos dados (getWeekAccumulated)
 * roda uma vez em HomePage.jsx e desce como prop `data`, pra não refazer a
 * consulta toda vez que a aba "Gráficos" é reaberta (BasicTabs desmonta/
 * remonta a cada troca). A captura diária às 16h roda sozinha no Postgres
 * (pg_cron, ver supabase/migrations/ltp_quantity_snapshots.sql) — este
 * componente nunca escreve, só lê o que já foi persistido.
 */
export default function LtpAccumulatorCard({ data, loading, error }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-2.5">
          <div className="shrink-0 w-8 h-8 rounded-xl bg-indigo-50 ring-2 ring-indigo-500/20 flex items-center justify-center">
            <Layers size={16} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Qtty LTP acumulado da semana
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              domingo → hoje · soma diária às 16h, sem deduplicar ordens repetidas entre dias
            </p>
          </div>
        </div>
        {data && data.daysCaptured > 0 && (
          <span className="shrink-0 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {data.daysCaptured}/{data.daysExpected} dias capturados
          </span>
        )}
      </div>

      {loading ? (
        <SkeletonBlock />
      ) : error ? (
        <div className="py-8 text-center text-slate-400 text-sm">
          Não foi possível carregar o acumulado. A tabela <code>ltp_quantity_snapshots</code> já
          existe no Supabase?
        </div>
      ) : !data || data.daysCaptured === 0 ? (
        <div className="py-8 text-center text-slate-400 text-sm">
          Nenhuma captura ainda esta semana. A próxima roda às 16h — volte depois desse horário.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <BigNumber label="LTP VD acumulado" value={data.vd} color={PRIMARY} />
            <BigNumber label="LTP DA acumulado" value={data.da} color={SECONDARY} />
          </div>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.days} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={30} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="vd" name="LTP VD" fill={PRIMARY} radius={[4, 4, 0, 0]}>
                  {data.days.map((d, i) => (
                    <Cell key={i} stroke={d.isToday ? TODAY_STROKE : "none"} strokeWidth={d.isToday ? 2 : 0} />
                  ))}
                </Bar>
                <Bar dataKey="da" name="LTP DA" fill={SECONDARY} radius={[4, 4, 0, 0]}>
                  {data.days.map((d, i) => (
                    <Cell key={i} stroke={d.isToday ? TODAY_STROKE : "none"} strokeWidth={d.isToday ? 2 : 0} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
