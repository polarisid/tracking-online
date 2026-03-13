import React from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as PieTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip
} from 'recharts';

// Distinct modern color palettes
const COLORS_DIST = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];
const COLORS_BACKLOG = ['#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

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
  
  // New Analytics metrics
  rtatVd = 0,
  rtatDa = 0,
  totalDa = 0,
  daNoParts = 0,
  inRoute = 0,
  firstVisitWait = 0
}) => {

  const pieData = [
    { name: 'LTP VD', value: dataLtpVd },
    { name: 'EX LTP VD', value: dataExLtpVd },
    { name: 'LTP RAC/REF', value: dataLtpRacRef },
    { name: 'EX LTP RAC/REF', value: dataExLtpRacRef },
    { name: 'LTP WSM', value: dataLtpWsm },
  ].filter(item => item.value > 0);

  const barData = [
    { name: 'Fora Prz Cons', total: dataDaOudated },
    { name: 'Fora Prz RC', total: dataDaCompleteOudated },
    { name: 'Agenda Hoje', total: dataAgendaToday },
    { name: 'Agenda Amanhã', total: dataAgendaTomorrow }
  ];

  // RTAT Averaging (Average days)
  const rtatData = [
    { name: 'RTAT VD', media: parseFloat(rtatVd) || 0, fill: '#f59e0b' },
    { name: 'RTAT DA', media: parseFloat(rtatDa) || 0, fill: '#ef4444' }
  ];

  // Total Backlog Overview
  const backlogData = [
    { name: 'Total DA', value: totalDa },
    { name: 'DA Sem Peça', value: daNoParts },
    { name: 'Em Rota', value: inRoute },
    { name: 'First Visit', value: firstVisitWait }
  ].filter(item => item.value > 0);

  return (
    <div className="flex flex-col gap-6 my-8 w-full max-w-screen-2xl mx-auto px-4">
      {/* Top Row: Distribution and Scheduling */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Pie Chart Card */}
        <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-w-0">
          <h3 className="text-sm font-bold text-slate-500 mb-6 text-center uppercase tracking-wider">Distribuição por Categoria</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_DIST[index % COLORS_DIST.length]} />
                  ))}
                </Pie>
                <PieTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
              </PieChart>
            </ResponsiveContainer>
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
                <BarTooltip
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: RTAT and Backlog */}
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* RTAT Bar Chart */}
        <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-w-0">
          <h3 className="text-sm font-bold text-slate-500 mb-6 text-center uppercase tracking-wider">Tempos Médios de Resolução (RTAT)</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rtatData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{fill: '#64748b', fontSize: 11}} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{fill: '#475569', fontSize: 12, fontWeight: 600}} axisLine={false} tickLine={false} />
                <BarTooltip
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value) => [`${value} dias`, 'Média']}
                />
                <Bar dataKey="media" radius={[0, 4, 4, 0]} barSize={40}>
                  {rtatData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Backlog Pie Chart */}
        <div className="flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-w-0">
          <h3 className="text-sm font-bold text-slate-500 mb-6 text-center uppercase tracking-wider">Composição do Backlog Principal</h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={backlogData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={100}
                  dataKey="value"
                  labelLine={true}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {backlogData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_BACKLOG[index % COLORS_BACKLOG.length]} />
                  ))}
                </Pie>
                <PieTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
