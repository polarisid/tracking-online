import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Monitor, MonitorOff, Clock, Database, FastForward, X } from 'lucide-react';
import { EASE } from './ui/motion';

const FUTURE_PRESETS = [1, 2, 3, 5, 7, 10, 14, 30];
const MAX_FUTURE_DAYS = 60;

// Botão "Futuro": abre um popover pra escolher quantos dias somar ao TAT de
// todas as OS. Ativo, o botão fica âmbar e mostra "+Nd".
const FutureControl = ({ days, onChange }) => {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const apply = (n) => {
    const v = Math.max(0, Math.min(MAX_FUTURE_DAYS, Math.floor(Number(n)) || 0));
    onChange(v);
    setCustom('');
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm ${
          days
            ? 'bg-amber-50 text-amber-700 border-amber-300'
            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
        }`}
      >
        <FastForward size={13} />
        <span className="max-sm:hidden">Futuro</span>
        {days > 0 && <span>+{days}d</span>}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Simular dias no futuro"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: EASE } }}
            exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.12 } }}
            className="absolute right-0 top-full mt-2 w-[min(18rem,calc(100vw-1.5rem))] bg-white rounded-2xl border border-slate-200 shadow-panel-hover p-4 z-40 origin-top-right"
          >
            <p className="text-[13px] font-bold text-slate-800">Simular o futuro</p>
            <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
              Soma os dias ao TAT de todas as ordens e mostra quantas estariam em LTP e EX-LTP.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {FUTURE_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => apply(n)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                    days === n
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700'
                  }`}
                >
                  +{n}d
                </button>
              ))}
            </div>
            <form
              className="flex items-center gap-2 mt-3"
              onSubmit={(e) => { e.preventDefault(); if (custom) apply(custom); }}
            >
              <input
                type="number"
                min={1}
                max={MAX_FUTURE_DAYS}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder={`Outro valor (1–${MAX_FUTURE_DAYS})`}
                className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              <button
                type="submit"
                disabled={!custom}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white disabled:opacity-40"
              >
                Aplicar
              </button>
            </form>
            {days > 0 && (
              <button
                type="button"
                onClick={() => apply(0)}
                className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100"
              >
                <X size={12} /> Voltar para hoje
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HeaderComponent = ({ presentationMode, onTogglePresentation, dataLoaded = false, dataSource, lastUpdated, title = 'Dashboard', futureDays = 0, onFutureDaysChange }) => {
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
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
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
          <div className="hidden sm:flex items-center gap-1.5 mt-0.5">
            <Clock size={11} className="text-slate-400" />
            <span className="text-slate-400 text-[11px] font-medium capitalize">{formattedDate} • {formattedTime}</span>
          </div>
        </div>

        {/* Direita: origem, sincronização, status e ações */}
        <div className="flex items-center gap-2 sm:gap-2.5">
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
          <div className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-full text-xs font-semibold border ${
            dataLoaded
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
              : 'bg-slate-100 text-slate-400 border-slate-200'
          }`}>
            <span className="relative flex h-2 w-2">
              {dataLoaded && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping" />}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${dataLoaded ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </span>
            <span className="max-sm:hidden">{dataLoaded ? 'Dados carregados' : 'Sem dados'}</span>
          </div>

          {onFutureDaysChange && dataLoaded && (
            <FutureControl days={futureDays} onChange={onFutureDaysChange} />
          )}

          {onTogglePresentation && (
            <motion.button
              onClick={onTogglePresentation}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className={`max-md:hidden flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
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
