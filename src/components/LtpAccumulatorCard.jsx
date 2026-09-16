import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { getWeekAccumulated } from "../utils/ltpQuantityService";
import { getCleanSourceName } from "../utils/dataSource";

const PRIMARY = "#6366f1";   // indigo-500 — LTP VD (mesma primária do app)
const SECONDARY = "#f59e0b"; // amber-500 — LTP DA (distinta da primária)

const tooltipStyle = {
  borderRadius: "8px",
  border: "none",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
  fontSize: 12,
};

function BigNumber({ label, value, color }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-extrabold leading-tight mt-1" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

/**
 * Qtty LTP acumulado da semana (domingo → hoje), VD e DA.
 * A captura diária às 16h roda sozinha no Postgres (pg_cron, ver
 * supabase/migrations/ltp_quantity_snapshots.sql) — este componente só lê o
 * que já foi persistido, sem nenhum efeito de gravação no front-end.
 */
export default function LtpAccumulatorCard({ dataSource }) {
  const [state, setState] = useState({ loading: true, error: null, data: null });

  useEffect(() => {
    if (!dataSource || dataSource === "Sem dados") {
      setState({ loading: false, error: null, data: null });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    getWeekAccumulated(getCleanSourceName(dataSource))
      .then((data) => {
        if (!cancelled) setState({ loading: false, error: null, data });
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[LTP Acumulado] Falha ao carregar:", err);
          setState({ loading: false, error: err.message || "Falha ao carregar", data: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dataSource]);

  const { loading, error, data } = state;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Qtty LTP acumulado da semana
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            domingo → hoje · soma diária às 16h, sem deduplicar ordens repetidas entre dias
          </p>
        </div>
        {data && data.daysCaptured > 0 && (
          <span className="shrink-0 text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {data.daysCaptured}/{data.daysExpected} dias capturados
          </span>
        )}
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-400 text-sm">Carregando...</div>
      ) : error ? (
        <div className="py-8 text-center text-slate-400 text-sm">
          Não foi possível carregar o acumulado. A tabela <code>ltp_quantity_snapshots</code> já
          existe no Supabase?
        </div>
      ) : !data || data.daysCaptured === 0 ? (
        <div className="py-8 text-center text-slate-400 text-sm">
          Nenhuma captura ainda esta semana — a próxima roda às 16h.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <BigNumber label="LTP VD acumulado" value={data.vd} color={PRIMARY} />
            <BigNumber label="LTP DA acumulado" value={data.da} color={SECONDARY} />
          </div>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.days} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={30} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="vd" name="LTP VD" fill={PRIMARY} radius={[4, 4, 0, 0]} />
                <Bar dataKey="da" name="LTP DA" fill={SECONDARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
