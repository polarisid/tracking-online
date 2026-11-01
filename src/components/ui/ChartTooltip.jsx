import React from "react";

/**
 * Tooltip padrão dos gráficos (recharts `content`): cartão branco com o rótulo
 * em cima e uma linha por série (bolinha da cor + nome + valor). Mesmo visual
 * em todos os gráficos, no lugar do tooltipStyle solto de cada arquivo.
 * `format(value, name, entry)` devolve o texto do valor; `labelFormat` o título.
 */
export default function ChartTooltip({ active, payload, label, format, labelFormat, hideLabel = false }) {
  if (!active || !payload || payload.length === 0) return null;
  const rows = payload.filter((p) => p.value !== null && p.value !== undefined);
  if (rows.length === 0) return null;
  const title = labelFormat ? labelFormat(label, payload) : label;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur px-3 py-2 shadow-panel-hover min-w-[120px]">
      {!hideLabel && title !== undefined && title !== "" && (
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
      )}
      {rows.map((p, i) => (
        <div key={`${p.dataKey ?? p.name}-${i}`} className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.payload?.fill || p.stroke }} />
            {p.name ?? p.payload?.name}
          </span>
          <span className="font-bold text-slate-800 tabular-nums">
            {format ? format(p.value, p.name, p) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}
