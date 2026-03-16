import React from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, TrendingUp, Truck, Clock, Package } from 'lucide-react';

/**
 * Executive Summary panel — designed for director-level at-a-glance view.
 * Shows overall system health, top KPIs, and critical alerts.
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
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30', ring: 'ring-emerald-500/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30', ring: 'ring-amber-500/20' },
    red: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30', ring: 'ring-red-500/20' },
  };
  const colors = colorMap[health.color];

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Top Status Bar */}
      <div className={`flex items-center justify-between px-6 py-3 ${colors.bg} border-b ${colors.border}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${colors.bg} ring-2 ${colors.ring}`}>
            <HealthIcon size={20} className={colors.text} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Status Geral</p>
            <p className={`text-lg font-black ${colors.text}`}>{health.label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Última atualização</p>
          <p className="text-sm font-semibold text-slate-600">
            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100">
        <MiniKpi icon={TrendingUp} label="% Penetração" value={`${pctPenetration}%`} sub={`${totalLtpAll}/${totalBase}`} color="blue" />
        <MiniKpi icon={Truck} label="Em Rota" value={inRouteCount} sub="ordens ativas" color="cyan" />
        <MiniKpi icon={Clock} label="RTAT VD" value={`${rtatVd} dias`} sub={parseFloat(rtatVd) > 4 ? '⚠ acima da meta' : '✓ dentro da meta'} color={parseFloat(rtatVd) > 4 ? 'red' : 'emerald'} />
        <MiniKpi icon={Package} label="Agenda Hoje" value={agendaToday} sub="visitas agendadas" color="violet" />
      </div>

      {/* Alerts */}
      {health.issues.length > 0 && (
        <div className="px-6 py-3 border-t border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Alertas</p>
          <div className="flex flex-wrap gap-2">
            {health.issues.map((issue, i) => (
              <span key={i} className="px-3 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full border border-red-200">
                {issue}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MiniKpi = ({ icon: Icon, label, value, sub, color }) => {
  const textColors = {
    blue: 'text-blue-600', cyan: 'text-cyan-600', emerald: 'text-emerald-600',
    red: 'text-red-600', violet: 'text-violet-600', amber: 'text-amber-600',
  };
  return (
    <div className="bg-white p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-slate-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <p className={`text-2xl font-black tracking-tight ${textColors[color] || 'text-slate-900'}`}>{value}</p>
      <p className="text-[11px] text-slate-400 font-medium">{sub}</p>
    </div>
  );
};

export default ExecutiveSummary;
