import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Layers, X } from "lucide-react";
import { getSnapshotOrders } from "../utils/ltpQuantityService";

const PRIMARY = "#6366f1";    // indigo-500 — LTP VD (mesma primária do app)
const SECONDARY = "#f59e0b";  // amber-500 — LTP DA (distinta da primária)
const TERTIARY = "#f43f5e";   // rose-500 — EX-LTP VD (mesma família "urgente" das EX-LTP no resto do app)
const QUATERNARY = "#8b5cf6"; // violet-500 — EX-LTP DA
const TODAY_STROKE = "#1e293b"; // slate-800 — mesmo destaque de "selecionado" usado em DashboardCharts

const CATEGORY_LABELS = { VD: "LTP VD", DA: "LTP DA", EX_VD: "EX-LTP VD", EX_DA: "EX-LTP DA" };

const tooltipStyle = {
  borderRadius: "8px",
  border: "none",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
  fontSize: 12,
};

function BigNumber({ label, value, color, percent }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-1.5 mt-1">
        <p className="text-3xl font-extrabold leading-tight" style={{ color }}>
          {value}
        </p>
        {percent !== null && percent !== undefined && (
          <span className="text-xs font-bold" style={{ color }}>
            {percent}%
          </span>
        )}
      </div>
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-2.5 w-16 bg-slate-200 rounded-full" />
            <div className="h-7 w-12 bg-slate-200 rounded-md" />
          </div>
        ))}
      </div>
      <div className="h-[160px] bg-slate-100 rounded-lg" />
    </div>
  );
}

/**
 * Qtty LTP/EX-LTP acumulado da semana (domingo → hoje), VD e DA.
 * Componente de apresentação puro — a busca dos dados (getWeekAccumulated)
 * roda uma vez em HomePage.jsx e desce como prop `data`, pra não refazer a
 * consulta toda vez que a aba "Gráficos" é reaberta (BasicTabs desmonta/
 * remonta a cada troca). A captura diária às 16h roda sozinha no Postgres
 * (pg_cron, ver supabase/migrations/ltp_quantity_snapshots.sql) — este
 * componente nunca escreve, só lê o que já foi persistido.
 */
export default function LtpAccumulatorCard({ data, loading, error, percent }) {
  const [selected, setSelected] = useState(null); // { date, label, category }
  const [orders, setOrders] = useState({ loading: false, error: null, list: [] });

  // Troca de ASC (unidade) invalida a seleção — dia/categoria de uma unidade
  // não fazem sentido pra outra.
  useEffect(() => {
    setSelected(null);
  }, [data?.tableName]);

  function handleBarClick(day, category) {
    const value = { VD: day.vd, DA: day.da, EX_VD: day.exVd, EX_DA: day.exDa }[category];
    if (value === null || value === undefined) return; // dia sem captura, nada a mostrar

    if (selected && selected.date === day.date && selected.category === category) {
      setSelected(null);
      return;
    }
    setSelected({ date: day.date, label: day.label, category });
    setOrders({ loading: true, error: null, list: [] });
    getSnapshotOrders(data.tableName, day.date, category)
      .then((list) => setOrders({ loading: false, error: null, list }))
      .catch((err) => setOrders({ loading: false, error: err, list: [] }));
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-2.5">
          <div className="shrink-0 w-8 h-8 rounded-xl bg-indigo-50 ring-2 ring-indigo-500/20 flex items-center justify-center">
            <Layers size={16} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Qtty LTP/EX-LTP acumulado da semana
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              domingo → hoje · soma diária às 16h, sem deduplicar ordens repetidas entre dias
            </p>
          </div>
        </div>
        {data && data.daysCaptured > 0 && (
          <span className="shrink-0 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {data.daysCaptured}/{data.daysExpected} dias capturados
          </span>
        )}
      </div>

      {loading ? (
        <SkeletonBlock />
      ) : error ? (
        <div className="py-8 text-center text-slate-400 text-sm">
          Não foi possível carregar o acumulado. A tabela <code>ltp_quantity_snapshots</code> já
          existe no Supabase?
        </div>
      ) : !data || data.daysCaptured === 0 ? (
        <div className="py-8 text-center text-slate-400 text-sm">
          Nenhuma captura ainda esta semana. A próxima roda às 16h — volte depois desse horário.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <BigNumber label="LTP VD acumulado" value={data.vd} color={PRIMARY} percent={percent?.vd} />
            <BigNumber label="LTP DA acumulado" value={data.da} color={SECONDARY} percent={percent?.da} />
            <BigNumber label="EX-LTP VD acumulado" value={data.exVd} color={TERTIARY} />
            <BigNumber label="EX-LTP DA acumulado" value={data.exDa} color={QUATERNARY} />
          </div>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.days} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={30} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="vd" name="LTP VD" fill={PRIMARY} radius={[4, 4, 0, 0]} onClick={(entry) => handleBarClick(entry, "VD")} cursor="pointer">
                  {data.days.map((d, i) => (
                    <Cell key={i} stroke={d.isToday ? TODAY_STROKE : "none"} strokeWidth={d.isToday ? 2 : 0} />
                  ))}
                </Bar>
                <Bar dataKey="da" name="LTP DA" fill={SECONDARY} radius={[4, 4, 0, 0]} onClick={(entry) => handleBarClick(entry, "DA")} cursor="pointer">
                  {data.days.map((d, i) => (
                    <Cell key={i} stroke={d.isToday ? TODAY_STROKE : "none"} strokeWidth={d.isToday ? 2 : 0} />
                  ))}
                </Bar>
                <Bar dataKey="exVd" name="EX-LTP VD" fill={TERTIARY} radius={[4, 4, 0, 0]} onClick={(entry) => handleBarClick(entry, "EX_VD")} cursor="pointer">
                  {data.days.map((d, i) => (
                    <Cell key={i} stroke={d.isToday ? TODAY_STROKE : "none"} strokeWidth={d.isToday ? 2 : 0} />
                  ))}
                </Bar>
                <Bar dataKey="exDa" name="EX-LTP DA" fill={QUATERNARY} radius={[4, 4, 0, 0]} onClick={(entry) => handleBarClick(entry, "EX_DA")} cursor="pointer">
                  {data.days.map((d, i) => (
                    <Cell key={i} stroke={d.isToday ? TODAY_STROKE : "none"} strokeWidth={d.isToday ? 2 : 0} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">Clique numa barra pra ver as OS do dia.</p>

          {selected && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  OS em {CATEGORY_LABELS[selected.category] || selected.category} · {selected.label}
                </p>
                <button
                  onClick={() => setSelected(null)}
                  className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Fechar"
                >
                  <X size={14} />
                </button>
              </div>

              {orders.loading ? (
                <p className="text-xs text-slate-400 py-2">Carregando...</p>
              ) : orders.error ? (
                <p className="text-xs text-slate-400 py-2">Não foi possível carregar as OS deste dia.</p>
              ) : orders.list.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">
                  Nenhuma OS registrada pra este dia — captura anterior a este detalhe (só dias capturados depois do detalhamento têm essa lista).
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-left text-slate-400">
                        <th className="font-semibold pb-1">OS</th>
                        <th className="font-semibold pb-1">Modelo</th>
                        <th className="font-semibold pb-1">Motivo</th>
                        <th className="font-semibold pb-1 text-right">Dias</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.list.map((o, i) => (
                        <tr key={i} className="border-t border-slate-50">
                          <td className="py-1 font-semibold text-slate-700">{o.service_order_no || o.asc_job_no || "—"}</td>
                          <td className="py-1 text-slate-500">{o.model || "—"}</td>
                          <td className="py-1 text-slate-500">{o.reason || "—"}</td>
                          <td className="py-1 text-right text-slate-500">{o.pending_aging_days ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
