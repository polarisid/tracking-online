import React, { useState, useEffect } from 'react';
import { Monitor, MonitorOff, Clock, Database } from 'lucide-react';

const HeaderComponent = ({ presentationMode, onTogglePresentation, dataLoaded = false }) => {
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
    <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-screen-2xl mx-auto px-6 py-2.5 flex items-center justify-between">
        {/* Left: Page Title + Date */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-slate-800 font-bold text-base leading-tight tracking-tight">
              Dashboard
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock size={11} className="text-slate-400" />
              <span className="text-slate-400 text-[11px] font-medium capitalize">{formattedDate} • {formattedTime}</span>
            </div>
          </div>
        </div>

        {/* Right: Status + Actions */}
        <div className="flex items-center gap-3">
          {/* Data Status Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            dataLoaded
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : 'bg-slate-100 text-slate-400 border border-slate-200'
          }`}>
            <Database size={12} />
            {dataLoaded ? 'Dados Carregados' : 'Sem Dados'}
          </div>

          {/* Presentation Mode Toggle */}
          {onTogglePresentation && (
            <button
              onClick={onTogglePresentation}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                presentationMode
                  ? 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-200'
                  : 'bg-blue-50 text-blue-500 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              {presentationMode ? (
                <><MonitorOff size={13} /> Sair</>
              ) : (
                <><Monitor size={13} /> Apresentar</>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default HeaderComponent;
