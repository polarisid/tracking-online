import React from "react";

/**
 * Cabeçalho de seção de relatório (estilo Power BI): título + subtítulo à
 * esquerda, controles (slicers, filtros) à direita.
 */
export default function SectionHeader({ icon: Icon, title, subtitle, actions, className = "" }) {
  return (
    <div className={`flex items-center justify-between gap-3 flex-wrap ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <div className="shrink-0 w-9 h-9 rounded-xl bg-indigo-50 ring-1 ring-indigo-500/15 flex items-center justify-center">
            <Icon size={18} className="text-indigo-600" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-800 leading-tight tracking-tight">{title}</h2>
          {subtitle && <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
