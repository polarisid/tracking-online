import React from 'react';
import { ArrowRight, FastForward, RotateCcw } from 'lucide-react';
import Panel from './ui/Panel';
import Sparkline from './ui/Sparkline';
import { AnimatedNumber, Stagger, StaggerItem } from './ui/motion';

const COLUMNS = [
  { key: 'ltpVd', label: 'LTP VD', base: 'baseVD', text: 'text-blue-600', hex: '#3b82f6' },
  { key: 'exVd', label: 'EX-LTP VD', base: 'baseVD', text: 'text-rose-600', hex: '#f43f5e' },
  { key: 'ltpDa', label: 'LTP DA', base: 'baseDA', text: 'text-amber-600', hex: '#f59e0b' },
  { key: 'exDa', label: 'EX-LTP DA', base: 'baseDA', text: 'text-violet-600', hex: '#8b5cf6' },
];

const pct = (value, base) => (base > 0 ? `${((value / base) * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` : '—');

/**
 * Simulação "Futuro": quantas OS estariam em LTP / EX-LTP daqui a N dias se
 * nenhuma for atendida até lá (o aging de todas soma N dias). Os números do
 * resto do dashboard também refletem a simulação enquanto ela estiver ativa.
 */
const FutureProjectionPanel = ({ projection, onReset }) => {
  const { days, targetDate, now, future, series } = projection;
  const rawDate = targetDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
  const dateLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);
  const totalNow = COLUMNS.reduce((sum, c) => sum + now[c.key], 0);
  const totalFuture = COLUMNS.reduce((sum, c) => sum + future[c.key], 0);
  const totalDelta = totalFuture - totalNow;

  return (
    <Panel
      icon={FastForward}
      title={`Projeção para daqui a ${days} ${days === 1 ? 'dia' : 'dias'}`}
      subtitle={dateLabel}
      className="mt-3 !border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-white"
      bodyClassName="p-4 flex flex-col gap-3"
      actions={
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
        >
          <RotateCcw size={12} /> Voltar para hoje
        </button>
      }
    >
      <Stagger className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {COLUMNS.map(({ key, label, base, text }) => {
          const delta = future[key] - now[key];
          return (
            <StaggerItem key={key} className="rounded-xl border border-slate-200/80 bg-white p-3 flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-slate-400 tabular-nums">{now[key]}</span>
                <ArrowRight size={12} className="text-slate-300 self-center" />
                <span className={`text-2xl font-black tracking-tight ${text}`}>
                  <AnimatedNumber value={future[key]} />
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <DeltaChip delta={delta} />
                <span className="text-[10px] font-semibold text-slate-400 tabular-nums">{pct(future[key], projection[base])} da base</span>
              </div>
            </StaggerItem>
          );
        })}

        <StaggerItem className="col-span-2 lg:col-span-1 rounded-xl border border-amber-200 bg-amber-50/70 p-3 flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700/70">Total em LTP</span>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-amber-700/60 tabular-nums">{totalNow}</span>
            <ArrowRight size={12} className="text-amber-400 self-center" />
            <span className="text-2xl font-black tracking-tight text-amber-700">
              <AnimatedNumber value={totalFuture} />
            </span>
          </div>
          <DeltaChip delta={totalDelta} />
          <Sparkline data={series} color="#f59e0b" height={22} className="w-full mt-0.5" />
        </StaggerItem>
      </Stagger>

      <p className="text-[11px] text-slate-400 leading-snug">
        Simulação: soma {days} {days === 1 ? 'dia' : 'dias'} ao TAT de todas as ordens, supondo que nenhuma seja atendida até lá. Os demais
        indicadores da tela refletem essa simulação; nada é gravado no histórico.
      </p>
    </Panel>
  );
};

const DeltaChip = ({ delta }) => {
  const tone = delta > 0 ? 'bg-red-50 text-red-600 border-red-200' : delta < 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200';
  return (
    <span className={`inline-flex w-fit items-center px-1.5 py-0.5 rounded-md border text-[10px] font-bold tabular-nums ${tone}`}>
      {delta > 0 ? `+${delta}` : delta}
    </span>
  );
};

export default FutureProjectionPanel;
