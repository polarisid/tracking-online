import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Monitor, MonitorOff, Clock, Database } from 'lucide-react';
import { EASE } from './ui/motion';

const HeaderComponent = ({ presentationMode, onTogglePresentation, dataLoaded = false, dataSource, lastUpdated, title = 'Dashboard' }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = time.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const formattedTime = time.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header className="w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/70 sticky top-0 z-30">
      <div className="max-w-screen-2xl mx-auto px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Esquerda: título da área atual + data/hora */}
        <div className="min-w-0">
          <div className="h-6 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.h1
                key={title}
                className="text-slate-800 font-bold text-base leading-6 tracking-tight truncate"
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1, transition: { duration: 0.28, ease: EASE } }}
                exit={{ y: -16, opacity: 0, transition: { duration: 0.12 } }}
              >
                {title}
              </motion.h1>
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock size={11} className="text-slate-400" />
            <span className="text-slate-400 text-[11px] font-medium capitalize">{formattedDate} • {formattedTime}</span>
          </div>
        </div>

        {/* Direita: origem, sincronização, status e ações */}
        <div className="flex items-center gap-2.5">
          {dataLoaded && dataSource && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50/80 text-indigo-600 border border-indigo-100/80 text-[10px] font-bold uppercase tracking-wider">
              <Database size={11} className="shrink-0" />
              <span>Base: {dataSource}</span>
            </div>
          )}
          {dataLoaded && lastUpdated && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/80 text-slate-600 border border-slate-200/80 text-[10px] font-bold uppercase tracking-wider">
              <Clock size={11} className="shrink-0" />
              <span>Sinc: {lastUpdated}</span>
            </div>
          )}

          {/* Status dos dados — ponto pulsando quando há dados carregados */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
            dataLoaded
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
              : 'bg-slate-100 text-slate-400 border-slate-200'
          }`}>
            <span className="relative flex h-2 w-2">
              {dataLoaded && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping" />}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${dataLoaded ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </span>
            {dataLoaded ? 'Dados carregados' : 'Sem dados'}
          </div>

          {onTogglePresentation && (
            <motion.button
              onClick={onTogglePresentation}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                presentationMode
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-indigo-500/25'
              }`}
            >
              {presentationMode ? (
                <><MonitorOff size={13} /> Sair</>
              ) : (
                <><Monitor size={13} /> Apresentar</>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderComponent;
