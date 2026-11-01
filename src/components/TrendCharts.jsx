import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, LineChart as LineChartIcon, Clock } from "lucide-react";
import LtpAccumulatorCard from "./LtpAccumulatorCard";
import Panel from "./ui/Panel";
import Sparkline from "./ui/Sparkline";
import SectionHeader from "./ui/SectionHeader";
import ChartTooltip from "./ui/ChartTooltip";
import { AnimatedNumber, Stagger, StaggerItem } from "./ui/motion";

// Métricas do histórico que valem uma linha de evolução. Os snapshots diários já
// são persistidos (asc_metrics_history); aqui a gente finalmente os visualiza.
const METRICS = [
  { key: "quantity_LTP_VD", label: "LTP VD IH", decimals: 0, betterWhenLower: true },
  { key: "quantity_EX_LTP_VD", label: "EX-LTP VD", decimals: 0, betterWhenLower: true },
  { key: "inRoute", label: "Ordens em Rota", decimals: 0, betterWhenLower: false },
  { key: "quantity_all_outdated_orders", label: "Ordens Desatualizadas", decimals: 0, betterWhenLower: true },
  { key: "average", label: "RTAT VD", decimals: 2, betterWhenLower: true },
  { key: "average2", label: "RTAT DA", decimals: 2, betterWhenLower: true },
  // % LTP = qtty em LTP / total de OS daquela linha em LP (pendente + reparo
  // completo) — derivado, não um campo gravado direto. Snapshots antigos (de
  // antes de quantity_total_vd_lp/da_lp existirem) ficam sem ponto aqui.
  {
    key: "pctLtpVd",
    label: "% LTP VD",
    decimals: 1,
    betterWhenLower: true,
    accessor: (h) => (h.quantity_total_vd_lp ? (h.quantity_LTP_VD / h.quantity_total_vd_lp) * 100 : null),
  },
  {
    key: "pctLtpDa",
    label: "% LTP DA",
    decimals: 1,
    betterWhenLower: true,
    // LTP DA = RAC/REF + WSM/HKE somados — mesma definição do da_count do
    // acumulado semanal (capture_ltp_snapshot()), não só RAC/REF sozinho.
    accessor: (h) => (h.quantity_total_da_lp ? ((h.quantity_LTP_RAC_REF || 0) + (h.quantity_LTP_WSM || 0)) / h.quantity_total_da_lp * 100 : null),
  },
  {
    key: "pctExLtpVd",
    label: "% EX-LTP VD",
    decimals: 1,
    betterWhenLower: true,
    accessor: (h) => (h.quantity_total_vd_lp ? (h.quantity_EX_LTP_VD / h.quantity_total_vd_lp) * 100 : null),
  },
  {
    key: "pctExLtpDa",
    label: "% EX-LTP DA",
    decimals: 1,
    betterWhenLower: true,
    accessor: (h) => (h.quantity_total_da_lp ? (h.quantity_EX_LTP_RAC_REF / h.quantity_total_da_lp) * 100 : null),
  },
];

// Janelas de tempo do gráfico. Baseado em TEMPO (não em nº de registros): assim,
// sincronizar muito no mesmo dia não "empurra" os dias anteriores para fora.
const WINDOWS = [
  { key: "3d", label: "3 dias", days: 3 },
  { key: "7d", label: "7 dias", days: 7 },
  { key: "30d", label: "30 dias", days: 30 },
  { key: "all", label: "Tudo", days: null },
];

const PRIMARY = "#6366f1"; // indigo-500 (mesma primária do app)
const UP = "#ef4444";      // vermelho = piora
const DOWN = "#10b981";    // verde = melhora

function fmt(v, decimals) {
  if (v === null || v === undefined || isNaN(v)) return "-";
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatWhen(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) +
    " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Leitura da série de uma métrica: valores, variação no período e se isso é
// melhora ou piora (depende da direção: backlog cai = bom; em rota é neutro).
function useMetricSeries(metric, history) {
  return useMemo(() => {
    const data = history.map((h) => {
      const raw = metric.accessor ? metric.accessor(h) : h[metric.key];
      return { label: formatWhen(h.timestamp), value: typeof raw === "number" && !isNaN(raw) ? raw : null };
    });
    const values = data.map((d) => d.value).filter((v) => v !== null);
    const first = values[0];
    const last = values[values.length - 1];
    const delta = first !== undefined && last !== undefined ? +(last - first).toFixed(metric.decimals) : 0;
    const isImproving = metric.betterWhenLower ? delta < 0 : delta > 0;
    const color = delta === 0 ? "#94a3b8" : isImproving ? DOWN : UP;
    const min = values.length ? Math.min(...values) : null;
    const max = values.length ? Math.max(...values) : null;
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
    return { data, values, last, delta, color, min, max, avg };
  }, [history, metric]);
}

function DeltaChip({ delta, decimals, color }) {
  const Icon = delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
      style={{ color, backgroundColor: `${color}1a` }}
      title="Variação no período disponível"
    >
      <Icon size={12} />
      {delta > 0 ? `+${fmt(delta, decimals)}` : fmt(delta, decimals)}
    </span>
  );
}

// Tile pequeno (small multiple): número atual, variação e sparkline. Clicar
// seleciona a métrica no gráfico grande — como um cross-filter do Power BI.
function MetricTile({ metric, history, selected, onSelect }) {
  const { values, last, delta, color } = useMetricSeries(metric, history);
  return (
    <StaggerItem>
      <button
        type="button"
        onClick={() => onSelect(metric.key)}
        aria-pressed={selected}
        className={`group relative w-full text-left bg-white rounded-2xl border p-3.5 transition-all duration-300 ${
          selected
            ? "border-indigo-300 ring-2 ring-indigo-500/20 shadow-panel-hover"
            : "border-slate-200/80 shadow-panel hover:shadow-panel-hover hover:-translate-y-0.5"
        }`}
      >
        <span
          className={`absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-transparent via-indigo-400 to-transparent transition-opacity duration-300 ${
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        />
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{metric.label}</p>
          <DeltaChip delta={delta} decimals={metric.decimals} color={color} />
        </div>
        <p className="text-2xl font-black tracking-tight text-slate-800 leading-tight mt-1">
          {last === undefined ? "—" : <AnimatedNumber value={last} decimals={metric.decimals} />}
        </p>
        <Sparkline data={values} color={color} height={26} className="w-full mt-1" />
      </button>
    </StaggerItem>
  );
}

// O gráfico grande: a métrica selecionada em detalhe, com média do período,
// mín/máx e tooltip. Os chips no topo trocam a métrica (slicer).
function HeroChart({ metric, history, onSelect }) {
  const { data, last, delta, color, min, max, avg } = useMetricSeries(metric, history);
  const gid = `hero-${metric.key}`;
  const stats = [
    { label: "Mínimo", value: min },
    { label: "Média", value: avg },
    { label: "Máximo", value: max },
  ];

  return (
    <Panel
      icon={LineChartIcon}
      title={metric.label}
      subtitle="Evolução no período selecionado"
      className="h-full"
      bodyClassName="p-4 flex flex-col gap-3"
    >
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Métrica do gráfico">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={m.key === metric.key}
            onClick={() => onSelect(m.key)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
              m.key === metric.key
                ? "bg-indigo-500 text-white border-indigo-500 shadow-sm shadow-indigo-500/25"
                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-black tracking-tight text-slate-800">
            {last === undefined ? "—" : <AnimatedNumber value={last} decimals={metric.decimals} />}
          </span>
          <DeltaChip delta={delta} decimals={metric.decimals} color={color} />
        </div>
        <div className="flex items-center gap-5">
          {stats.map((st) => (
            <div key={st.label} className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{st.label}</p>
              <p className="text-sm font-bold text-slate-600 tabular-nums">{fmt(st.value, metric.decimals)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[260px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.3} />
                <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={40} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={36} allowDecimals={metric.decimals > 0} domain={["auto", "auto"]} />
            <Tooltip
              cursor={{ stroke: "#c7d2fe", strokeWidth: 1.5 }}
              content={<ChartTooltip format={(v) => fmt(v, metric.decimals)} />}
            />
            {avg !== null && <ReferenceLine y={avg} stroke="#a5b4fc" strokeDasharray="4 4" />}
            <Area
              type="monotone"
              dataKey="value"
              name={metric.label}
              stroke={PRIMARY}
              strokeWidth={2.5}
              fill={`url(#${gid})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: PRIMARY }}
              connectNulls
              animationDuration={700}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-slate-400 -mt-1">A linha tracejada é a média do período.</p>
    </Panel>
  );
}

// RTAT real (turnaround) das OS concluídas na semana, por categoria (DA/DTV).
function WeeklyRtatCard({ label, data }) {
  const has = data && data.count > 0;
  const count = data?.count || 0;
  return (
    <StaggerItem className="h-full">
      <div className="h-full bg-white rounded-2xl border border-slate-200/80 shadow-panel p-3.5 transition-shadow duration-300 hover:shadow-panel-hover">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="shrink-0 w-6 h-6 rounded-lg bg-indigo-50 ring-1 ring-indigo-500/15 flex items-center justify-center">
              <Clock size={12} className="text-indigo-600" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">RTAT {label} · semana</p>
          </div>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">{count} OS</span>
        </div>
        <p className="text-2xl font-black tracking-tight text-slate-800 leading-tight mt-1.5 whitespace-nowrap">
          {has ? <AnimatedNumber value={data.avg} decimals={1} /> : "—"}
          {has && <span className="text-xs font-bold text-slate-400 ml-1">dias</span>}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {has ? "média das concluídas na semana" : "nenhuma OS concluída na semana"}
        </p>
      </div>
    </StaggerItem>
  );
}

/**
 * Evolução no Tempo — transforma os snapshots já persistidos (localStorage +
 * asc_metrics_history no Supabase) em um relatório de tendência: gráfico
 * principal da métrica escolhida + painel de tiles (small multiples).
 * Também mostra o RTAT real (turnaround) das OS concluídas na semana (DA/DTV).
 */
export default function TrendCharts({ history = [], weeklyRtat = null, ltpAccumulated = null, ltpPercent = null }) {
  const [windowKey, setWindowKey] = useState("3d");
  const [selectedKey, setSelectedKey] = useState(METRICS[0].key);
  const win = WINDOWS.find((w) => w.key === windowKey) || WINDOWS[0];
  const selectedMetric = METRICS.find((m) => m.key === selectedKey) || METRICS[0];

  const recent = useMemo(() => {
    const arr = Array.isArray(history) ? history : [];
    if (arr.length === 0 || win.days == null) return arr;
    // Janela relativa ao snapshot MAIS RECENTE (robusto a dados antigos/lacunas):
    // "últimos N dias de dados", não N dias a partir de agora.
    const latest = arr[arr.length - 1]?.timestamp ?? Date.now();
    const cutoff = latest - win.days * 24 * 60 * 60 * 1000;
    return arr.filter((h) => (h.timestamp ?? 0) >= cutoff);
  }, [history, win.days]);

  const subtitle = recent.length >= 2
    ? `${recent.length} registros · ${win.days ? `últimos ${win.days} dias` : "todo o histórico"}`
    : "Cada atualização de dados vira um ponto na linha";

  return (
    <section className="max-w-screen-2xl mx-auto w-full px-4 pt-2 pb-1 flex flex-col gap-4">
      <SectionHeader
        icon={LineChartIcon}
        title="Evolução no tempo"
        subtitle={subtitle}
        actions={
          <div className="relative inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm" role="group" aria-label="Período">
            {WINDOWS.map((w) => (
              <button
                key={w.key}
                type="button"
                onClick={() => setWindowKey(w.key)}
                aria-pressed={windowKey === w.key}
                className={`relative px-3 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                  windowKey === w.key ? "text-white" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {windowKey === w.key && (
                  <motion.span
                    layoutId="trend-window-pill"
                    className="absolute inset-0 rounded-lg bg-indigo-500 shadow-sm shadow-indigo-500/30"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <span className="relative">{w.label}</span>
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3 items-stretch">
        <div className="lg:col-span-2 min-w-0">
          {recent.length < 2 ? (
            <Panel
              icon={LineChartIcon}
              title="Histórico insuficiente"
              subtitle="Ainda não há pontos suficientes para uma tendência"
              className="h-full"
              bodyClassName="p-8 text-center text-sm text-slate-400"
            >
              Os gráficos aparecem conforme os dados são carregados ao longo dos dias.
              <br />
              Cada atualização vira um ponto na linha.
            </Panel>
          ) : (
            <HeroChart metric={selectedMetric} history={recent} onSelect={setSelectedKey} />
          )}
        </div>
        <div className="min-w-0">
          <LtpAccumulatorCard data={ltpAccumulated?.data} loading={ltpAccumulated?.loading} error={ltpAccumulated?.error} percent={ltpPercent} />
        </div>
      </div>

      {recent.length >= 2 ? (
        <Stagger gap={0.03} className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {METRICS.map((m) => (
            <MetricTile key={m.key} metric={m} history={recent} selected={m.key === selectedMetric.key} onSelect={setSelectedKey} />
          ))}
          {weeklyRtat && <WeeklyRtatCard label="DA" data={weeklyRtat.da} />}
          {weeklyRtat && <WeeklyRtatCard label="DTV" data={weeklyRtat.dtv} />}
        </Stagger>
      ) : (
        weeklyRtat && (
          <Stagger className="grid gap-3 grid-cols-1 sm:grid-cols-2 max-w-xl">
            <WeeklyRtatCard label="DA" data={weeklyRtat.da} />
            <WeeklyRtatCard label="DTV" data={weeklyRtat.dtv} />
          </Stagger>
        )
      )}
    </section>
  );
}
