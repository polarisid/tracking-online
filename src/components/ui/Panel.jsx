import React from "react";

/**
 * Painel padrão do app — a "visual" de um relatório Power BI: cabeçalho com
 * ícone + título + subtítulo + ações à direita, corpo livre embaixo. Usar em
 * vez de repetir `bg-white rounded-2xl border ...` em cada bloco, pra todos
 * terem a mesma moldura, sombra e comportamento de hover.
 */
export default function Panel({
  icon: Icon,
  title,
  subtitle,
  actions,
  children,
  className = "",
  bodyClassName = "p-4",
  hover = true,
}) {
  const hasHeader = Icon || title || subtitle || actions;
  return (
    <section
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-panel transition-shadow duration-300 ${
        hover ? "hover:shadow-panel-hover" : ""
      } ${className}`}
    >
      {hasHeader && (
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="shrink-0 w-8 h-8 rounded-xl bg-indigo-50 ring-1 ring-indigo-500/15 flex items-center justify-center">
                <Icon size={16} className="text-indigo-600" />
              </div>
            )}
            <div className="min-w-0">
              {title && <h3 className="text-[13px] font-bold text-slate-800 leading-tight truncate">{title}</h3>}
              {subtitle && <p className="text-[11px] text-slate-400 leading-tight mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
