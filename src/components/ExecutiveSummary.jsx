import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, AlertCircle, TrendingUp, Truck, Clock, Package, Layers } from 'lucide-react';
import { AnimatedNumber, Reveal, Stagger, StaggerItem } from './ui/motion';
import Sparkline from './ui/Sparkline';

// Cor de cada tile: classe do número + hex da sparkline/linha de destaque.
const TONES = {
  blue: { text: 'text-blue-600', hex: '#3b82f6' },
  cyan: { text: 'text-cyan-600', hex: '#06b6d4' },
  emerald: { text: 'text-emerald-600', hex: '#10b981' },
  red: { text: 'text-red-600', hex: '#ef4444' },
  violet: { text: 'text-violet-600', hex: '#8b5cf6' },
  amber: { text: 'text-amber-600', hex: '#f59e0b' },
  rose: { text: 'text-rose-600', hex: '#f43f5e' },
};

/**
 * Executive Summary panel — designed for director-level at-a-glance view.
 * Shows overall system health, top KPIs, and critical alerts.
 * `metrics.sparks` (opcional): séries curtas do histórico pra desenhar a
 * tendência dentro de cada tile (inRoute, rtatVd, rtatDa, ltp).
 */
const ExecutiveSummary = ({ metrics = {} }) => {
  const {
    totalLtpAll = 0,
    totalBase = 0,
    pctPenetration = 0,
    inRouteCount = 0,
    rtatVd = 0,
    rtatDa = 0,
    overdueCount = 0,
    daNoParts = 0,
    agendaToday = 0,
    ltpVdAccum = null,
    ltpDaAccum = null,
    exLtpVdAccum = null,
    exLtpDaAccum = null,
    ltpAccumPercent = {},
    sparks = {},
  } = metrics;

  // Health indicator calc
  const getHealth = () => {
    const issues = [];
    if (parseFloat(rtatDa) > 5) issues.push('RTAT DA acima de 5 dias');
    if (parseFloat(rtatVd) > 4) issues.push('RTAT VD acima de 4 dias');
    if (overdueCount > 10) issues.push(`${overdueCount} ordens fora do prazo`);
    if (daNoParts > 20) issues.push(`${daNoParts} DA sem peça`);

    if (issues.length === 0) return { status: 'healthy', label: 'Saudável', color: 'emerald', icon: CheckCircle, issues };
    if (issues.length <= 2) return { status: 'attention', label: 'Atenção', color: 'amber', icon: AlertTriangle, issues };
    return { status: 'critical', label: 'Crítico', color: 'red', icon: AlertCircle, issues };
  };

  const health = getHealth();
  const HealthIcon = health.icon;

  const colorMap = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30', ring: 'ring-emerald-500/20', dot: 'bg-emerald-400' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30', ring: 'ring-amber-500/20', dot: 'bg-amber-400' },
    red: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30', ring: 'ring-red-500/20', dot: 'bg-red-400' },
  };
  const colors = colorMap[health.color];

  const rtatVdBad = parseFloat(rtatVd) > 4;
  const rtatDaBad = parseFloat(rtatDa) > 5;

  return (
    <Reveal className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-panel overflow-hidden">
      {/* Barra de status geral */}
      <div className={`flex items-center justify-between px-6 py-3 ${colors.bg} border-b ${colors.border}`}>
        <div className="flex items-center gap-3">
          <div className={`relative p-2 rounded-xl ${colors.bg} ring-2 ${colors.ring}`}>
            {health.status !== 'healthy' && (
              <span className={`absolute inset-0 rounded-xl ${colors.dot} opacity-20 animate-ping`} />
            )}
            <HealthIcon size={20} className={`relative ${colors.text}`} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Status Geral</p>
            <p className={`text-lg font-black ${colors.text}`}>{health.label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Última atualização</p>
          <p className="text-sm font-semibold text-slate-600 tabular-nums">
            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* KPIs — a fileira herói. LTP/EX-LTP acumulado é 1 tile só (mesma família de métrica). */}
      <Stagger className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-px bg-slate-100">
        <MiniKpi icon={TrendingUp} label="Impacto LTP" value={pctPenetration} decimals={1} suffix="%" sub={`${totalLtpAll} de ${totalBase}`} color="blue" spark={sparks.ltp} />
        <MiniKpi icon={Truck} label="Em Rota" value={inRouteCount} sub="ordens ativas" color="cyan" spark={sparks.inRoute} />
        <MiniKpi icon={Clock} label="RTAT VD" value={rtatVd} decimals={2} suffix=" dias" sub={rtatVdBad ? '⚠ acima da meta' : '✓ dentro da meta'} color={rtatVdBad ? 'red' : 'emerald'} spark={sparks.rtatVd} />
        <MiniKpi icon={Clock} label="RTAT DA" value={rtatDa} decimals={2} suffix=" dias" sub={rtatDaBad ? '⚠ acima da meta' : '✓ dentro da meta'} color={rtatDaBad ? 'red' : 'emerald'} spark={sparks.rtatDa} />
        <LtpAccumGroup vd={ltpVdAccum} da={ltpDaAccum} exVd={exLtpVdAccum} exDa={exLtpDaAccum} percent={ltpAccumPercent} />
        <MiniKpi icon={Package} label="Agenda Hoje" value={agendaToday} sub="visitas agendadas" color="violet" />
      </Stagger>

      {/* Alertas */}
      {health.issues.length > 0 && (
        <div className="px-6 py-3 border-t border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Alertas</p>
          <div className="flex flex-wrap gap-2">
            {health.issues.map((issue, i) => (
              <motion.span
                key={issue}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.06, type: 'spring', stiffness: 380, damping: 22 }}
                className="px-3 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full border border-red-200"
              >
                {issue}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </Reveal>
  );
};

// Tile de KPI: rótulo, número que conta, subtexto e (opcional) sparkline. Uma
// linha de cor aparece no topo ao passar o mouse, e o tile sobe levemente.
const MiniKpi = ({ icon: Icon, label, value, decimals = 0, suffix = '', sub, color, spark }) => {
  const tone = TONES[color] || TONES.blue;
  return (
    <StaggerItem className="group relative bg-white p-4 flex flex-col gap-1 overflow-hidden transition-colors duration-300 hover:bg-slate-50/60">
      <span
        className="absolute inset-x-0 top-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${tone.hex}, transparent)` }}
      />
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-slate-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <p className={`text-2xl font-black tracking-tight whitespace-nowrap ${tone.text}`}>
        <AnimatedNumber value={value} decimals={decimals} suffix={suffix} suffixClassName={suffix.trim() !== '%' ? 'ml-1 text-xs font-bold text-slate-400' : ''} />
      </p>
      {spark && <Sparkline data={spark} color={tone.hex} height={24} className="w-full" />}
      <p className="text-[11px] text-slate-400 font-medium">{sub}</p>
    </StaggerItem>
  );
};

// LTP/EX-LTP acumulado da semana — 1 tile, 4 números num mini-grid, em vez de 4
// MiniKpi separados. col-span-2 pra caber as 4 sub-métricas sem espremer.
const LtpAccumGroup = ({ vd, da, exVd, exDa, percent = {} }) => {
  const items = [
    { label: 'VD', value: vd, pct: percent.vd, tone: TONES.blue },
    { label: 'DA', value: da, pct: percent.da, tone: TONES.amber },
    { label: 'EX-VD', value: exVd, pct: percent.exVd, tone: TONES.rose },
    { label: 'EX-DA', value: exDa, pct: percent.exDa, tone: TONES.violet },
  ];
  return (
    <StaggerItem className="group relative bg-white p-4 flex flex-col gap-1.5 col-span-2 overflow-hidden transition-colors duration-300 hover:bg-slate-50/60">
      <span className="absolute inset-x-0 top-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
      <div className="flex items-center gap-2">
        <Layers size={14} className="text-slate-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">LTP acumulado · semana</span>
      </div>
      <div className="grid grid-cols-4 gap-x-2">
        {items.map(({ label, value, pct, tone }) => (
          <div key={label} className="flex flex-col">
            <span className={`text-xl font-black tracking-tight leading-tight ${tone.text}`}>
              <AnimatedNumber value={value} />
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              {label}{pct !== null && pct !== undefined ? ` · ${Number(pct).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` : ''}
            </span>
          </div>
        ))}
      </div>
    </StaggerItem>
  );
};

export default ExecutiveSummary;
