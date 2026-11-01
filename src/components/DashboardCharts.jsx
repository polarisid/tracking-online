import React, { useState } from 'react';
import {
  BarChart, Bar, Cell, LabelList, PieChart, Pie, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { motion } from 'framer-motion';
import { BarChart3, CalendarClock, Gauge, ListOrdered, PieChart as PieIcon, Percent, X } from 'lucide-react';
import Panel from './ui/Panel';
import SectionHeader from './ui/SectionHeader';
import ChartTooltip from './ui/ChartTooltip';
import { AnimatedNumber, EASE, Stagger, StaggerItem } from './ui/motion';

// Cor primária do app (mesma usada nos gradientes de header) — comparações de
// magnitude usam 1 única cor sequencial, não uma paleta categórica arco-íris.
const PRIMARY = '#6366f1'; // indigo-500
const NEUTRAL = '#cbd5e1'; // slate-300 — tom de "não é o destaque"
const DIMMED = '#e2e8f0';  // slate-200 — o que fica de fora quando há seleção

// Status é uma escala fixa e reservada (nunca decorativa) — mesmas cores que
// StatCard.jsx já usa para type 'high'/'mid'/'normal', para os dois lados concordarem.
const STATUS_COLORS = {
  high: '#ef4444',   // red-500
  mid: '#f59e0b',    // amber-500
  normal: '#94a3b8', // slate-400
};

// Metas de RTAT em dias — as mesmas que o ExecutiveSummary usa pra acusar "acima da meta".
const RTAT_TARGETS = { vd: 4, da: 5 };

// Categorias da distribuição: mesma cor de cada linha no resto do app
// (VD azul, EX-VD rosa, DA âmbar, EX-DA violeta).
const CATEGORY_COLORS = {
  'LTP VD': '#3b82f6',
  'EX LTP VD': '#f43f5e',
  'LTP RAC/REF': '#f59e0b',
  'EX LTP RAC/REF': '#8b5cf6',
  'LTP WSM': '#14b8a6',
};

const AXIS_TICK = { fill: '#94a3b8', fontSize: 11 };

// Tick do eixo X que quebra o rótulo em linhas (uma por palavra). Sem isso o
// recharts esconde rótulos que se sobrepõem — no celular sumiam 2 de 4 barras.
const WrapTick = ({ x, y, payload }) => (
  <text x={x} y={y + 10} textAnchor="middle" fill="#64748b" fontSize={10} fontWeight={600}>
    {String(payload.value).split(' ').map((word, i) => (
      <tspan key={i} x={x} dy={i === 0 ? 0 : 12}>{word}</tspan>
    ))}
  </text>
);

// Barra de percentual. A trilha (track) é sempre um tom claro da MESMA cor do
// preenchimento — nunca um cinza genérico desconectado — para o medidor ler
// como "uma rampa só".
const PercentGauge = ({ label, value, total, color, trackColor }) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  const width = Math.min(pct, 100);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-baseline">
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] font-semibold text-slate-400 tabular-nums">{value} / {total}</span>
          <span className="text-sm font-black tabular-nums" style={{ color }}>
            <AnimatedNumber value={pct} decimals={1} suffix="%" />
          </span>
        </div>
      </div>
      <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: trackColor || '#f1f5f9' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.9, ease: EASE }}
        />
      </div>
    </div>
  );
};

// Barra "bullet" (Power BI): valor atual preenchendo a trilha, com um marcador
// na meta. Cor = status real do indicador, não categoria.
const RtatBullet = ({ label, value, target, status }) => {
  const color = STATUS_COLORS[status] || STATUS_COLORS.normal;
  const scaleMax = Math.max(value, target) * 1.3 || 1;
  const valuePct = (value / scaleMax) * 100;
  const targetPct = (target / scaleMax) * 100;
  const diff = value - target;
  const over = diff > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-black tracking-tight leading-none mt-1" style={{ color }}>
            <AnimatedNumber value={value} decimals={2} />
            <span className="ml-1 text-xs font-bold text-slate-400">dias</span>
          </p>
        </div>
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ color: over ? STATUS_COLORS.high : '#10b981', backgroundColor: over ? '#fef2f2' : '#ecfdf5' }}
        >
          {over ? '+' : ''}{diff.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} d vs meta
        </span>
      </div>
      <div className="relative h-3 rounded-full bg-slate-100">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${valuePct}%` }}
          transition={{ duration: 0.9, ease: EASE }}
        />
        <div className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-slate-700" style={{ left: `${targetPct}%` }} title={`Meta ${target} dias`} />
      </div>
      <p className="text-[10px] text-slate-400">
        Meta: <span className="font-bold text-slate-500">{target} dias</span>
      </p>
    </div>
  );
};

// Rosca de "parte do todo": a soma das categorias de LTP/EX-LTP. Clicar numa
// fatia (ou na linha da legenda) destaca a categoria e esmaece as outras.
const DistributionDonut = ({ data }) => {
  const [active, setActive] = useState(null);
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const activeItem = data.find((d) => d.name === active);

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-[220px] text-slate-400 text-sm">Sem dados no momento</div>;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative w-[210px] h-[210px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTooltip hideLabel format={(v) => `${v} ordens`} />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              cornerRadius={4}
              stroke="none"
              onClick={(d) => setActive((prev) => (prev === d.name ? null : d.name))}
              animationDuration={800}
            >
              {data.map((d) => (
                <Cell
                  key={d.name}
                  fill={CATEGORY_COLORS[d.name] || PRIMARY}
                  fillOpacity={active && active !== d.name ? 0.25 : 1}
                  cursor="pointer"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black tracking-tight text-slate-800">
            <AnimatedNumber value={activeItem ? activeItem.value : total} />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {activeItem ? activeItem.name : 'ordens em LTP'}
          </span>
        </div>
      </div>

      <ul className="flex-1 w-full flex flex-col gap-1">
        {data.map((d) => {
          const isDim = active && active !== d.name;
          return (
            <li key={d.name}>
              <button
                type="button"
                onClick={() => setActive((prev) => (prev === d.name ? null : d.name))}
                aria-pressed={active === d.name}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-all ${
                  active === d.name ? 'bg-slate-100' : 'hover:bg-slate-50'
                } ${isDim ? 'opacity-40' : ''}`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[d.name] || PRIMARY }} />
                <span className="flex-1 text-xs font-semibold text-slate-600 truncate">{d.name}</span>
                <span className="text-xs font-black text-slate-800 tabular-nums">{d.value}</span>
                <span className="w-12 text-right text-[11px] font-semibold text-slate-400 tabular-nums">
                  {total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

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
  backlogHeaders = [],

  // Cabeçalho da seção ("Situação atual"). Desligado por padrão porque o
  // Modo Apresentação e a AlfaPage renderizam estes gráficos dentro de outros layouts.
  showSectionHeader = false,
}) => {
  const [selectedReason, setSelectedReason] = useState(null);

  // Comparação de magnitude entre categorias → ordenado do maior pro menor
  const distributionData = [
    { name: 'LTP VD', value: dataLtpVd },
    { name: 'EX LTP VD', value: dataExLtpVd },
    { name: 'LTP RAC/REF', value: dataLtpRacRef },
    { name: 'EX LTP RAC/REF', value: dataExLtpRacRef },
    { name: 'LTP WSM', value: dataLtpWsm },
  ].filter(item => item.value > 0).sort((a, b) => b.value - a.value);

  // Fora do prazo = status (vermelho reservado); agenda = cor primária.
  const barData = [
    { name: 'Fora Prz Cons', total: dataDaOudated, color: STATUS_COLORS.high },
    { name: 'Fora Prz RC', total: dataDaCompleteOudated, color: STATUS_COLORS.high },
    { name: 'Agenda Hoje', total: dataAgendaToday, color: PRIMARY },
    { name: 'Agenda Amanhã', total: dataAgendaTomorrow, color: '#a5b4fc' },
  ];

  const rtatVdNum = parseFloat(rtatVd) || 0;
  const rtatDaNum = parseFloat(rtatDa) || 0;

  // Backlog by Reason — emphasis: só o motivo #1 (maior backlog) recebe destaque;
  // com um motivo selecionado, ele vira o destaque e o resto esmaece.
  const backlogByReasonData = backlogReasonData.map(([reason, count]) => ({
    name: reason,
    total: count,
  }));
  const topBacklogReason = backlogByReasonData[0]?.name;
  const backlogTotal = backlogByReasonData.reduce((sum, d) => sum + d.total, 0);

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

  const reasonFill = (name) => {
    if (selectedReason) return name === selectedReason ? PRIMARY : DIMMED;
    return name === topBacklogReason ? PRIMARY : NEUTRAL;
  };

  // Combined LTP + EX-LTP total for VD
  const totalLtpVd = dataLtpVd + dataExLtpVd;

  return (
    <div className="flex flex-col gap-4 my-6 w-full max-w-screen-2xl mx-auto px-4">
      {showSectionHeader && (
        <SectionHeader
          icon={BarChart3}
          title="Situação atual"
          subtitle="Foto do momento: LTP, prazos, RTAT e backlog. Clique nos gráficos para destacar."
        />
      )}

      {/* Linha 1: distribuição e prazos */}
      <Stagger className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <StaggerItem className="lg:col-span-5 min-w-0">
          <Panel icon={PieIcon} title="Distribuição por categoria" subtitle="Ordens em LTP e EX-LTP por linha" className="h-full" bodyClassName="p-4">
            <DistributionDonut data={distributionData} />
          </Panel>
        </StaggerItem>

        <StaggerItem className="lg:col-span-7 min-w-0">
          <Panel icon={CalendarClock} title="Prazos e agenda" subtitle="Ordens fora do prazo e visitas agendadas" className="h-full" bodyClassName="p-4">
            <div className="h-[230px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 18, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                  <XAxis dataKey="name" tick={<WrapTick />} interval={0} height={44} axisLine={false} tickLine={false} />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip format={(v) => `${v} ordens`} />} />
                  <Bar dataKey="total" name="Ordens" radius={[6, 6, 0, 0]} maxBarSize={56} animationDuration={800}>
                    {barData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                    <LabelList dataKey="total" position="top" style={{ fill: '#334155', fontSize: 12, fontWeight: 800 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </StaggerItem>
      </Stagger>

      {/* Linha 2: RTAT e backlog */}
      <Stagger className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <StaggerItem className="lg:col-span-5 min-w-0">
          <Panel icon={Gauge} title="Tempo médio de resolução (RTAT)" subtitle="Média atual contra a meta" className="h-full" bodyClassName="p-5 flex flex-col gap-7">
            <RtatBullet label="RTAT VD" value={rtatVdNum} target={RTAT_TARGETS.vd} status={rtatVdStatus} />
            <RtatBullet label="RTAT DA" value={rtatDaNum} target={RTAT_TARGETS.da} status={rtatDaStatus} />
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider pt-1 border-t border-slate-100">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.high }} />Alto</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.mid }} />Médio</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.normal }} />Normal</span>
              <span className="flex items-center gap-1.5 ml-auto normal-case tracking-normal font-semibold text-slate-400"><span className="w-0.5 h-3 bg-slate-700 rounded-full" />Meta</span>
            </div>
          </Panel>
        </StaggerItem>

        {/* Backlog por reason (IH, LTP > 7) — clique numa barra pra listar as ordens */}
        <StaggerItem className="lg:col-span-7 min-w-0">
          <Panel
            icon={ListOrdered}
            title="Backlog por reason"
            subtitle={`IH com LTP acima de 7 dias · ${backlogTotal} ${backlogTotal === 1 ? 'ordem' : 'ordens'}`}
            className="h-full"
            bodyClassName="p-4"
            actions={selectedReason && (
              <button
                type="button"
                onClick={() => setSelectedReason(null)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors"
              >
                <X size={11} /> Limpar filtro
              </button>
            )}
          >
            <div className="w-full" style={{ height: Math.max(260, backlogByReasonData.length * 40) }}>
              {backlogByReasonData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={backlogByReasonData} layout="vertical" margin={{ top: 5, right: 36, left: 8, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
                    <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} width={160} interval={0} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip hideLabel format={(v) => `${v} ordens`} />} />
                    <Bar dataKey="total" name="Ordens" radius={[0, 6, 6, 0]} barSize={18} cursor="pointer" onClick={handleBarClick} animationDuration={800}>
                      {backlogByReasonData.map((entry) => (
                        <Cell key={entry.name} fill={reasonFill(entry.name)} />
                      ))}
                      <LabelList dataKey="total" position="right" style={{ fill: '#334155', fontSize: 11, fontWeight: 700 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">Nenhuma ordem em backlog</div>
              )}
            </div>

            {selectedReason && filteredBacklogOrders.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="mt-4 pt-4 border-t border-slate-100"
              >
                <h4 className="text-xs font-bold text-slate-700 mb-2">
                  {selectedReason} <span className="text-slate-400 font-semibold">· {filteredBacklogOrders.length} {filteredBacklogOrders.length === 1 ? 'ordem' : 'ordens'}</span>
                </h4>
                <div className="max-h-[300px] overflow-auto rounded-xl border border-slate-100">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        {backlogDetailCols.map(col => (
                          <th key={col} className="sticky top-0 bg-slate-50 px-2.5 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                            {backlogHeaders[col] || `Col ${col}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBacklogOrders.map((row, i) => (
                        <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/70">
                          {backlogDetailCols.map(col => (
                            <td key={col} className="px-2.5 py-1.5 text-slate-600 whitespace-nowrap">{row[col]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </Panel>
        </StaggerItem>
      </Stagger>

      {/* Linha 3: % de impacto — cada bloco usa 1 família de cor (mais forte =
          Total, mais claro = componentes), trilha = tom claro da mesma cor */}
      <Stagger className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StaggerItem className="min-w-0">
          <Panel icon={Percent} title="% Impacto LTP — categoria VD" subtitle={`Base: ${totalAllVdLp} ordens VD LP no sistema`} className="h-full" bodyClassName="p-5 flex flex-col gap-5">
            <PercentGauge label="LTP VD" value={dataLtpVd} total={totalAllVdLp} color="#a5b4fc" trackColor="#eef2ff" />
            <PercentGauge label="EX LTP VD" value={dataExLtpVd} total={totalAllVdLp} color="#818cf8" trackColor="#eef2ff" />
            <PercentGauge label="Total (LTP + EX LTP) VD" value={totalLtpVd} total={totalAllVdLp} color="#4f46e5" trackColor="#e0e7ff" />
          </Panel>
        </StaggerItem>

        <StaggerItem className="min-w-0">
          <Panel icon={Percent} title="% Impacto LTP — categoria DA" subtitle={`Base: ${totalAllDaLp} ordens DA LP no sistema`} className="h-full" bodyClassName="p-5 flex flex-col gap-5">
            <PercentGauge label="LTP RAC/REF" value={dataLtpRacRef} total={totalAllDaLp} color="#c4b5fd" trackColor="#f5f3ff" />
            <PercentGauge label="EX LTP RAC/REF" value={dataExLtpRacRef} total={totalAllDaLp} color="#a78bfa" trackColor="#f5f3ff" />
            <PercentGauge label="LTP WSM/HKE" value={dataLtpWsm} total={totalAllDaLp} color="#8b5cf6" trackColor="#f5f3ff" />
            <PercentGauge label="DA Sem Peça" value={daNoParts} total={totalAllDaLp} color="#6d28d9" trackColor="#ede9fe" />
          </Panel>
        </StaggerItem>
      </Stagger>
    </div>
  );
};

export default DashboardCharts;
