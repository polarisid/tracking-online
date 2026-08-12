import React, { useRef } from "react";
import { UploadCloud, FileSpreadsheet, ArrowRight } from "lucide-react";

/**
 * Estado vazio da dashboard — mostrado quando ainda não há planilha carregada.
 * Um empty state é um convite à ação, não um mostruário de zeros: traz o caminho
 * direto para carregar os dados (mesmo upload da "A. Pending" da barra lateral).
 */
const EmptyState = ({ onUpload }) => {
  const inputRef = useRef(null);

  return (
    <div className="w-full bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm px-6 py-10 md:py-14">
      <div className="max-w-md mx-auto flex flex-col items-center text-center">
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center ring-8 ring-indigo-50/60">
            <UploadCloud size={30} strokeWidth={2} />
          </div>
        </div>

        <h2 className="text-slate-800 font-bold text-lg tracking-tight">
          Comece carregando a planilha
        </h2>
        <p className="text-slate-500 text-sm leading-relaxed mt-1.5">
          Envie o relatório <span className="font-semibold text-slate-600">A. Pending</span> para
          gerar os indicadores, gráficos e o calendário de agendamentos.
        </p>

        {onUpload && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={onUpload}
            />
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-6 inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-lg px-5 py-2.5 transition-colors shadow-sm shadow-indigo-500/20"
            >
              <FileSpreadsheet size={16} /> Carregar A. Pending
            </button>
          </>
        )}

        <p className="mt-4 text-[11px] text-slate-400 flex items-center gap-1.5">
          Ou use os botões de upload na barra lateral <ArrowRight size={11} />
        </p>
      </div>
    </div>
  );
};

export default EmptyState;
