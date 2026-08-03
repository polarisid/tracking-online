import React, { useState } from 'react';
import {
  BarChart, Bar, Cell, LabelList, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

// Cor primária do app (mesma usada nos gradientes de header) — comparações de
// magnitude usam 1 única cor sequencial, não uma paleta categórica arco-íris.
const PRIMARY = '#6366f1'; // indigo-500
const NEUTRAL = '#cbd5e1'; // slate-300 — tom de "não é o destaque"

// Status é uma escala fixa e reservada (nunca decorativa) — mesmas cores que
// StatCard.jsx já usa para type 'high'/'mid'/'normal', para os dois lados concordarem.
const STATUS_COLORS = {
  high: '#ef4444',   // red-500
  mid: '#f59e0b',    // amber-500
  normal: '#94a3b8', // slate-400
};

const tooltipStyle = { borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' };

// Progress bar gauge component for percentage visualization.
// A trilha (track) é sempre um tom claro da MESMA cor do preenchimento — nunca
// um cinza genérico desconectado — para o medidor ler como "uma rampa só".
const PercentGauge = ({ label, value, total, color, trackColor }) => {
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
  const width = total > 0 ? Math.min((value / total) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">{value} / {total}</span>
          <span className="text-sm font-extrabold" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: trackColor || '#f1f5f9' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

// Pequena legenda de status (cor = significado, nunca só decoração) — usada
// no gráfico RTAT, onde a cor de cada barra reflete o valor real, não a categoria.
const StatusLegend = () => (
  <div className="flex items-center justify-center gap-4 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.high }} />Alto</span>
    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.mid }} />Médio</span>
    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.normal }} />Normal</span>
  </div>
);

const DashboardCharts = ({
  dataLtpVd = 0,
  dataExLtpVd = 0,
  dataLtpRacRef = 0,
  dataExLtpRacRef = 0,
  dataLtpWsm = 0,
  dataDaOudated = 0,
  dataDaCompleteOudated = 0,
  dataAgendaToday = 0,
  dataAgendaTomorrow = 0,

  // Analytics metrics
  rtatVd = 0,
  rtatDa = 0,
  rtatVdStatus = 'normal', // 'high' | 'mid' | 'normal' — mesmo cálculo do StatCard "RTAT VD"
  rtatDaStatus = 'normal', // 'high' | 'mid' | 'normal' — mesmo cálculo do StatCard "RTAT DA"
  daNoParts = 0,

  // Percentage chart totals
  totalAllDaLp = 0,
  totalAllVdLp = 0,

  // Backlog Reason data (IH, LTP > 7) — array de [reason, count], já vem ordenado
  // do maior para o menor (ver HomePage.jsx: ftfBacklogReasonEntries)
  backlogReasonData = [],
  backlogRawData = [],
  backlogHeaders = []
}) => {
  const [selectedReason, setSelectedReason] = useState(null);

  // Comparação de magnitude entre categorias → 1 cor só, ordenado do maior pro menor
  const distributionData = [
    { name: 'LTP VD', value: dataLtpVd },
    { name: 'EX LTP VD', value: dataExLtpVd },
    { name: 'LTP RAC/REF', value: dataLtpRacRef },
    { name: 'EX LTP RAC/REF', value: dataExLtpRacRef },
    { name: 'LTP WSM', value: dataLtpWsm },
  ].filter(item => item.value > 0).sort((a, b) => b.value - a.value);

  const barData = [
    { name: 'Fora Prz Cons', total: dataDaOudated },
    { name: 'Fora Prz RC', total: dataDaCompleteOudated },
    { name: 'Agenda Hoje', total: dataAgendaToday },
    { name: 'Agenda Amanhã', total: dataAgendaTomorrow }
  ];

  // RTAT — cor por status real (mesmos limiares do StatCard ao lado), não por categoria fixa
  const rtatData = [
    { name: 'RTAT VD', media: parseFloat(rtatVd) || 0, status: rtatVdStatus },
    { name: 'RTAT DA', media: parseFloat(rtatDa) || 0, status: rtatDaStatus }
  ];

  // Backlog by Reason — emphasis: só o motivo #1 (maior backlog) recebe destaque
  const backlogByReasonData = backlogReasonData.map(([reason, count]) => ({
    name: reason,
    total: count,
  }));
  const topBacklogReason = backlogByReasonData[0]?.name;

  // Columns to show in the backlog detail table
  const backlogDetailCols = [0, 1, 2, 9, 14, 15, 34, 11];
  const filteredBacklogOrders = selectedReason
    ? backlogRawData.filter(row => (row[14] || 'N/A') === selectedReason)
    : [];

  const handleBarClick = (data) => {
    if (data && data.name) {
      setSelectedReason(prev => prev === data.name ? null : data.name);
    }
  };

  // Combined LTP + EX-LTP total for VD
  const totalLtpVd = dataLtpVd + dataExLtpVd;

  return (
    <div className="flex flex-col gap-6 my-8 w-full max-w-screen-2xl mx-auto px-4">
      {/* Row 1: Distribution and Scheduling */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Distribuição por Categoria — comparação de magnitude, 1 cor, ordenado */}
        <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-w-0">
          <h3 className="text-sm font-bold text-slate-500 mb-6 text-center uppercase tracking-wider">Distribuição por Categoria</h3>
          <div className="h-[280px] w-full">
            {distributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={distributionData}
                  layout="vertical"
                  margin={{ top: 5, right: 40, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={110} interval={0} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={tooltipStyle} formatter={(value) => [`${value} ordens`, 'Quantidade']} />
                  <Bar dataKey="value" fill={PRIMARY} radius={[0, 4, 4, 0]} maxBarSize={28}>
                    <LabelList dataKey="value" position="right" style={{ fill: '#334155', fontSize: 11, fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sem dados no momento</div>
            )}
          </div>
        </div>

        {/* Bar Chart Card */}
        <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-w-0">
          <h3 className="text-sm font-bold text-slate-500 mb-6 text-center uppercase tracking-wider">Desempenho: Prazos e Agenda</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 11}} dy={10} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: '#64748b', fontSize: 11}} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="total" fill={PRIMARY} radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: RTAT and Backlog */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* RTAT Bar Chart — cor = status real (mesmo cálculo do StatCard ao lado) */}
        <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-w-0">
          <h3 className="text-sm font-bold text-slate-500 mb-1 text-center uppercase tracking-wider">Tempos Médios de Resolução (RTAT)</h3>
          <StatusLegend />
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rtatData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{fill: '#64748b', fontSize: 11}} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{fill: '#475569', fontSize: 12, fontWeight: 600}} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={tooltipStyle}
                  formatter={(value) => [`${value} dias`, 'Média']}
                />
                <Bar dataKey="media" radius={[0, 4, 4, 0]} barSize={40}>
                  {rtatData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || STATUS_COLORS.normal} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Backlog by Reason Chart (IH, LTP > 7) — emphasis: só o #1 motivo se destaca */}
        <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-w-0">
          <h3 className="text-sm font-bold text-slate-500 mb-2 text-center uppercase tracking-wider">Backlog por Reason (IH, LTP &gt; 7 dias)</h3>
          <p className="text-xs text-slate-400 text-center mb-4">Total: {backlogByReasonData.reduce((sum, d) => sum + d.total, 0)} ordens</p>
          <div className="w-full" style={{ height: Math.max(300, backlogByReasonData.length * 44) }}>
            {backlogByReasonData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={backlogByReasonData}
                  layout="vertical"
                  margin={{ top: 5, right: 40, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{fill: '#64748b', fontSize: 11}} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{fill: '#475569', fontSize: 10, fontWeight: 600}} axisLine={false} tickLine={false} width={160} interval={0} />
                  <Tooltip
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={tooltipStyle}
                    formatter={(value) => [`${value} ordens`, 'Quantidade']}
                  />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={20} cursor="pointer" onClick={handleBarClick}>
                    {backlogByReasonData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.name === topBacklogReason ? PRIMARY : NEUTRAL}
                        stroke={selectedReason === entry.name ? '#1e293b' : 'none'}
                        strokeWidth={selectedReason === entry.name ? 2 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">Nenhuma ordem em backlog</div>
            )}
          </div>
          {selectedReason && filteredBacklogOrders.length > 0 && (
            <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-700">
                  Ordens — {selectedReason} ({filteredBacklogOrders.length})
                </h4>
                <button
                  onClick={() => setSelectedReason(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
                >
                  ✕ Fechar
                </button>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="toggleDiv" style={{ width: '100%', fontSize: '12px' }}>
                  <thead>
                    <tr>
                      {backlogDetailCols.map(col => (
                        <th key={col} style={{ padding: '6px 8px', background: '#f1f5f9', fontWeight: 700, fontSize: '11px', color: '#475569', textAlign: 'left', position: 'sticky', top: 0 }}>
                          {backlogHeaders[col] || `Col ${col}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBacklogOrders.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        {backlogDetailCols.map(col => (
                          <td key={col} style={{ padding: '5px 8px', color: '#334155' }}>{row[col]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Percentage Penetration Gauges — cada bloco usa 1 família de cor
          (mais forte = Total, mais claro = componentes), trilha = tom claro da mesma cor */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* VD Category Percentages — família indigo */}
        <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-w-0">
          <h3 className="text-sm font-bold text-slate-500 mb-6 text-center uppercase tracking-wider">% Impacto LTP — Categoria VD</h3>
          <p className="text-xs text-slate-400 text-center mb-4">Base: {totalAllVdLp} ordens VD LP no sistema</p>
          <div className="flex flex-col gap-5 py-2">
            <PercentGauge label="LTP VD" value={dataLtpVd} total={totalAllVdLp} color="#a5b4fc" trackColor="#eef2ff" />
            <PercentGauge label="EX LTP VD" value={dataExLtpVd} total={totalAllVdLp} color="#818cf8" trackColor="#eef2ff" />
            <PercentGauge label="Total (LTP + EX LTP) VD" value={totalLtpVd} total={totalAllVdLp} color="#4f46e5" trackColor="#e0e7ff" />
          </div>
        </div>

        {/* DA Category Percentages — família violeta */}
        <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-w-0">
          <h3 className="text-sm font-bold text-slate-500 mb-6 text-center uppercase tracking-wider">% Impacto LTP — Categoria DA</h3>
          <p className="text-xs text-slate-400 text-center mb-4">Base: {totalAllDaLp} ordens DA LP no sistema</p>
          <div className="flex flex-col gap-5 py-2">
            <PercentGauge label="LTP RAC/REF" value={dataLtpRacRef} total={totalAllDaLp} color="#c4b5fd" trackColor="#f5f3ff" />
            <PercentGauge label="EX LTP RAC/REF" value={dataExLtpRacRef} total={totalAllDaLp} color="#a78bfa" trackColor="#f5f3ff" />
            <PercentGauge label="LTP WSM/HKE" value={dataLtpWsm} total={totalAllDaLp} color="#8b5cf6" trackColor="#f5f3ff" />
            <PercentGauge label="DA Sem Peça" value={daNoParts} total={totalAllDaLp} color="#6d28d9" trackColor="#ede9fe" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
