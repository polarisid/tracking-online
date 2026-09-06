import React from "react";
import { ShieldCheck, AlertTriangle, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

// A "leitura do dia" — status geral + o que precisa de atenção + o que mais se
// moveu. O Tracking Online falando como aliado analítico do gestor.
const LEVELS = {
  good: { color: "#10b981", bg: "bg-emerald-50", ring: "ring-emerald-500/20", text: "text-emerald-600", Icon: ShieldCheck },
  warn: { color: "#f59e0b", bg: "bg-amber-50", ring: "ring-amber-500/20", text: "text-amber-600", Icon: AlertTriangle },
  critical: { color: "#ef4444", bg: "bg-red-50", ring: "ring-red-500/20", text: "text-red-600", Icon: AlertCircle },
};

function fmtDiff(v) {
  const n = Number(v);
  const s = Math.abs(n).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  return `${n > 0 ? "+" : "−"}${s}`;
}

export default function InsightsBar({ insights }) {
  if (!insights) return null;
  const { level, statusLabel, headline, movers, comparisonLabel } = insights;
  const L = LEVELS[level] || LEVELS.good;
  const { Icon } = L;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm mt-3 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      {/* Status + leitura */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`shrink-0 w-9 h-9 rounded-xl ${L.bg} ring-2 ${L.ring} flex items-center justify-center`}>
          <Icon size={18} style={{ color: L.color }} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Leitura do dia</span>
            <span className={`text-[10px] font-black uppercase tracking-wider ${L.text}`}>{statusLabel}</span>
          </div>
          <p className="text-sm font-semibold text-slate-700 leading-snug truncate">{headline}</p>
        </div>
      </div>

      {/* Maiores movimentos vs comparação */}
      {movers && movers.length > 0 && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider text-slate-300">
            vs {comparisonLabel}
          </span>
          {movers.map((m, i) => (
            <span
              key={i}
              className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                m.better
                  ? "bg-emerald-50 text-emerald-600 border-emerald-500/20"
                  : "bg-rose-50 text-rose-600 border-rose-500/20"
              }`}
              title={`${m.label} ${fmtDiff(m.diff)} vs ${comparisonLabel}`}
            >
              {m.diff > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {m.label} {fmtDiff(m.diff)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
