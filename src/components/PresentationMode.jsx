import React from 'react';
import DashboardCharts from './DashboardCharts';

const PresentationMode = ({ metrics, onExit }) => {
  const {
    quantity_LTP_VD = 0,
    quantity_EX_LTP_VD = 0,
    quantity_LTP_RAC_REF = 0,
    quantity_EX_LTP_RAC_REF = 0,
    quantity_LTP_WSM = 0,
    inRouteCount = 0,
    rtatVd = 0,
    rtatDa = 0,
    totalAllDaLp = 0,
    totalAllVdLp = 0,
    quantity_DA_noParts = 0,
    quantity_Oudated_IH = 0,
    quantity_Oudated_Repair_complete_IH = 0,
    quantity_agenda_today = 0,
    quantity_agenda_tomorrow = 0,
    quantity_POTENTIAL_first_visit = 0,
    totalDa = 0,
  } = metrics;

  // Computed totals
  const totalLtp = quantity_LTP_VD + quantity_LTP_RAC_REF + quantity_LTP_WSM;
  const totalExLtp = quantity_EX_LTP_VD + quantity_EX_LTP_RAC_REF;
  const totalLtpAll = totalLtp + totalExLtp;
  const totalBase = totalAllVdLp + totalAllDaLp;
  const pctPenetration = totalBase > 0 ? ((totalLtpAll / totalBase) * 100).toFixed(1) : '0.0';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto">
      {/* Floating Exit Button */}
      <button
        onClick={onExit}
        className="fixed top-4 right-4 z-[60] px-4 py-2 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-all uppercase tracking-wider"
      >
        ✕ Sair da Apresentação
      </button>

      {/* Header Strip */}
      <div className="w-full bg-slate-900 border-b border-slate-800 px-8 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-lg">TO</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-2xl tracking-tight">Tracking Online</h1>
              <p className="text-slate-500 text-sm">Painel Executivo — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-full uppercase tracking-wider animate-pulse">
            ● Ao Vivo
          </span>
        </div>
      </div>

      {/* Hero KPI Row */}
      <div className="max-w-screen-2xl mx-auto px-8 pt-8">
        <h2 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Indicadores Principais</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <KpiHeroCard label="LTP VD" value={quantity_LTP_VD} color="blue" />
          <KpiHeroCard label="EX LTP VD" value={quantity_EX_LTP_VD} color="emerald" />
          <KpiHeroCard label="LTP RAC/REF" value={quantity_LTP_RAC_REF} color="amber" />
          <KpiHeroCard label="EX LTP RAC/REF" value={quantity_EX_LTP_RAC_REF} color="rose" />
          <KpiHeroCard label="LTP WSM" value={quantity_LTP_WSM} color="violet" />
          <KpiHeroCard label="Ordens Em Rota" value={inRouteCount} color="cyan" highlight />
        </div>

        {/* Summary Band */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <SummaryBand label="Total LTP" value={totalLtp} sub={`de ${totalBase} ordens LP`} color="blue" />
          <SummaryBand label="Total EX-LTP" value={totalExLtp} sub={`de ${totalBase} ordens LP`} color="emerald" />
          <SummaryBand label="% Penetração Geral" value={`${pctPenetration}%`} sub={`${totalLtpAll} / ${totalBase}`} color="violet" />
        </div>

        {/* RTAT Productivity */}
        <h2 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4 mt-6">Produtividade (RTAT — Dias Médios)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <RtatCard label="RTAT VD" value={rtatVd} target={3.8} />
          <RtatCard label="RTAT DA" value={rtatDa} target={4.5} />
        </div>

        {/* Charts */}
        <h2 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4 mt-6">Análise Visual</h2>
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-8">
          <DashboardCharts
            dataLtpVd={quantity_LTP_VD}
            dataExLtpVd={quantity_EX_LTP_VD}
            dataLtpRacRef={quantity_LTP_RAC_REF}
            dataExLtpRacRef={quantity_EX_LTP_RAC_REF}
            dataLtpWsm={quantity_LTP_WSM}
            dataDaOudated={quantity_Oudated_IH}
            dataDaCompleteOudated={quantity_Oudated_Repair_complete_IH}
            dataAgendaToday={quantity_agenda_today}
            dataAgendaTomorrow={quantity_agenda_tomorrow}
            rtatVd={rtatVd}
            rtatDa={rtatDa}
            totalDa={totalDa}
            daNoParts={quantity_DA_noParts}
            inRoute={inRouteCount}
            firstVisitWait={quantity_POTENTIAL_first_visit}
            totalAllDaLp={totalAllDaLp}
            totalAllVdLp={totalAllVdLp}
          />
        </div>
      </div>
    </div>
  );
};

// --- Sub-components for Presentation Mode ---

const KpiHeroCard = ({ label, value, color, highlight }) => {
  const colorMap = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    rose: 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-400',
    violet: 'from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-400',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
  };
  const cls = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-gradient-to-br ${cls} border rounded-xl p-5 flex flex-col items-center justify-center gap-2 ${highlight ? 'ring-2 ring-cyan-500/50 ring-offset-2 ring-offset-slate-950' : ''}`}>
      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
      <span className="text-4xl font-black text-white tracking-tight">{value}</span>
    </div>
  );
};

const SummaryBand = ({ label, value, sub, color }) => {
  const colorMap = {
    blue: 'border-blue-500/40 text-blue-400',
    emerald: 'border-emerald-500/40 text-emerald-400',
    violet: 'border-violet-500/40 text-violet-400',
  };
  const cls = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-slate-900 border ${cls} rounded-xl p-5 flex items-center justify-between`}>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
        <p className="text-xs text-slate-600 mt-0.5">{sub}</p>
      </div>
      <span className={`text-3xl font-black tracking-tight ${cls.split(' ').pop()}`}>{value}</span>
    </div>
  );
};

const RtatCard = ({ label, value, target }) => {
  const numVal = parseFloat(value) || 0;
  const isOver = numVal > target;
  const pct = target > 0 ? Math.min((numVal / (target * 1.5)) * 100, 100) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-bold text-white">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-black ${isOver ? 'text-red-400' : 'text-emerald-400'}`}>
            {numVal.toFixed ? numVal : numVal}
          </span>
          <span className="text-xs text-slate-600">dias</span>
        </div>
      </div>
      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${isOver ? 'bg-red-500' : 'bg-emerald-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-slate-600">0</span>
        <span className={`text-[10px] font-semibold ${isOver ? 'text-red-500' : 'text-slate-600'}`}>Meta: {target} dias</span>
      </div>
    </div>
  );
};

export default PresentationMode;
