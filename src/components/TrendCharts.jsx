import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, LineChart as LineChartIcon } from "lucide-react";

// Métricas do histórico que valem uma linha de evolução. Os snapshots diários já
// são persistidos (asc_metrics_history); aqui a gente finalmente os visualiza.
const METRICS = [
  { key: "quantity_LTP_VD", label: "LTP VD IH", decimals: 0, betterWhenLower: true },
  { key: "quantity_EX_LTP_VD", label: "EX-LTP VD", decimals: 0, betterWhenLower: true },
  { key: "inRoute", label: "Ordens em Rota", decimals: 0, betterWhenLower: false },
  { key: "quantity_all_outdated_orders", label: "Ordens Desatualizadas", decimals: 0, betterWhenLower: true },
  { key: "average", label: "RTAT VD", decimals: 2, betterWhenLower: true },
  { key: "average2", label: "RTAT DA", decimals: 2, betterWhenLower: true },
];

const PRIMARY = "#6366f1"; // indigo-500 (mesma primária do app)
const UP = "#ef4444";      // vermelho = piora
const DOWN = "#10b981";    // verde = melhora

const tooltipStyle = {
  borderRadius: "8px",
  border: "none",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
  fontSize: 12,
};

function fmt(v, decimals) {
  if (v === null || v === undefined || isNaN(v)) return "-";
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatWhen(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) +
    " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function MiniTrend({ metric, history }) {
  const data = useMemo(
    () => history.map((h) => ({ label: formatWhen(h.timestamp), value: typeof h[metric.key] === "number" ? h[metric.key] : null })),
    [history, metric.key]
  );

  const values = data.map((d) => d.value).filter((v) => v !== null);
  const first = values[0];
  const last = values[values.length - 1];
  const delta = first !== undefined && last !== undefined ? +(last - first).toFixed(metric.decimals) : 0;
  // "Melhora" depende da direção da métrica (backlog cai = bom; em rota é neutro).
  const isImproving = metric.betterWhenLower ? delta < 0 : delta > 0;
  const trendColor = delta === 0 ? "#94a3b8" : isImproving ? DOWN : UP;
  const TrendIcon = delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown;
  const gid = `grad-${metric.key}`;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{metric.label}</p>
          <p className="text-2xl font-extrabold text-slate-800 leading-tight">{fmt(last, metric.decimals)}</p>
        </div>
        <span
          className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full"
          style={{ color: trendColor, backgroundColor: `${trendColor}1a` }}
          title="Variação no período disponível"
        >
          <TrendIcon size={12} />
          {delta > 0 ? `+${fmt(delta, metric.decimals)}` : fmt(delta, metric.decimals)}
        </span>
      </div>
      <div className="h-[110px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.28} />
                <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 9 }} interval="preserveStartEnd" minTickGap={24} />
            <YAxis tick={{ fontSize: 9 }} width={30} allowDecimals={metric.decimals > 0} />
            <Tooltip formatter={(v) => fmt(v, metric.decimals)} contentStyle={tooltipStyle} labelStyle={{ fontSize: 11, color: "#64748b" }} />
            <Area type="monotone" dataKey="value" stroke={PRIMARY} strokeWidth={2} fill={`url(#${gid})`} dot={false} activeDot={{ r: 3 }} connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Evolução no Tempo — transforma os snapshots já persistidos (localStorage +
 * asc_metrics_history no Supabase) em gráficos de tendência das métricas-chave.
 */
export default function TrendCharts({ history = [] }) {
  const recent = useMemo(() => (Array.isArray(history) ? history.slice(-30) : []), [history]);

  return (
    <div className="max-w-screen-2xl mx-auto w-full px-4 py-2">
      <div className="flex items-center gap-2 mb-3">
        <LineChartIcon className="h-5 w-5 text-indigo-500" />
        <h2 className="text-lg font-bold text-slate-800">Evolução no Tempo</h2>
        {recent.length >= 2 && (
          <span className="text-[11px] font-semibold text-slate-400">
            últimos {recent.length} registros
          </span>
        )}
      </div>

      {recent.length < 2 ? (
        <div className="bg-white border border-slate-200 rounded-2xl text-center text-slate-400 text-sm py-10 px-4">
          Histórico ainda insuficiente para gerar tendências.
          <br />
          Os gráficos aparecem conforme os dados são carregados ao longo dos dias — cada
          atualização vira um ponto na linha.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {METRICS.map((m) => (
            <MiniTrend key={m.key} metric={m} history={recent} />
          ))}
        </div>
      )}
    </div>
  );
}
