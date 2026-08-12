import { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Button as MuiButton,
} from "@mui/material";
import {
  FileUp,
  ListChecks,
  Loader2,
  TrendingUp,
  TrendingDown,
  FileText,
  Building2,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { extractIndicatorPdf } from "../utils/indicatorPdfParser";
import indicatorReportService from "../utils/indicatorReportService";

// Mesma cor primária do resto do app (ver DashboardCharts.jsx).
const PRIMARY = "#6366f1"; // indigo-500
const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function formatMonthLabel(period) {
  const [year, month] = (period || "").split(".");
  const idx = parseInt(month, 10) - 1;
  const name = MONTH_NAMES[idx] || month;
  return `${name}/${(year || "").slice(2)}`;
}

// Mês posterior ao mês corrente não pode ter dado real ainda — protege relatórios
// já salvos de mostrar meses que ainda não existem.
function isFutureMonthPeriod(period) {
  const [y, m] = (period || "").split(".").map(Number);
  if (!y || !m || m > 12) return false;
  const now = new Date();
  return y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth() + 1);
}

function formatWeekLabel(period) {
  const [, week] = (period || "").split(".");
  return `Sem ${week}`;
}

function formatValue(value, unit) {
  if (value === null || value === undefined) return "-";
  if (unit === "percent") return `${value.toLocaleString("pt-BR")}%`;
  if (unit === "currency") return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return value.toLocaleString("pt-BR");
}

const tooltipStyle = {
  borderRadius: "8px",
  border: "none",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
  fontSize: 12,
};

function MetricChartCard({ metric }) {
  const monthlyData = metric.monthly
    .filter((p) => !isFutureMonthPeriod(p.period))
    .map((p) => ({ label: formatMonthLabel(p.period), value: p.value }));
  const weeklyData = metric.weekly.map((p) => ({ label: formatWeekLabel(p.period), value: p.value }));
  const DirectionIcon = metric.direction === "up" ? TrendingUp : metric.direction === "down" ? TrendingDown : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            {metric.name}
            {DirectionIcon && <DirectionIcon className="h-4 w-4 text-slate-400" />}
          </h3>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{metric.section}</p>
        </div>
        {metric.meta !== null && metric.meta !== undefined && (
          <span className="shrink-0 text-[11px] font-bold text-slate-600 border border-slate-200 rounded-full px-2.5 py-1">
            Meta: {formatValue(metric.meta, metric.unit)}
          </span>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Evolução Mensal</p>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} width={36} />
                <Tooltip formatter={(v) => formatValue(v, metric.unit)} contentStyle={tooltipStyle} />
                {metric.meta !== null && metric.meta !== undefined && (
                  <ReferenceLine y={metric.meta} stroke="#94a3b8" strokeDasharray="4 4" />
                )}
                <Line type="monotone" dataKey="value" stroke={PRIMARY} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Últimas Semanas</p>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={36} />
                <Tooltip formatter={(v) => formatValue(v, metric.unit)} contentStyle={tooltipStyle} />
                {metric.meta !== null && metric.meta !== undefined && (
                  <ReferenceLine y={metric.meta} stroke="#94a3b8" strokeDasharray="4 4" />
                )}
                <Bar dataKey="value" fill={PRIMARY} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackMetricsDialog({ report, trackedKeys, onSave }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setSelected(new Set(trackedKeys));
  }, [isOpen, trackedKeys]);

  const grouped = useMemo(() => {
    const map = new Map();
    report.metrics.forEach((m) => {
      if (!map.has(m.section)) map.set(m.section, []);
      map.get(m.section).push(m);
    });
    return Array.from(map.entries());
  }, [report]);

  const toggle = (key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const metrics = report.metrics
        .filter((m) => selected.has(m.key))
        .map((m) => ({ key: m.key, name: m.name, section: m.section }));
      await onSave(metrics);
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-xs font-bold text-slate-700 border border-slate-300 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
      >
        <ListChecks className="h-4 w-4" /> Escolher Indicadores
      </button>
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 16 }}>Indicadores acompanhados</DialogTitle>
        <DialogContent dividers>
          <p className="text-xs text-slate-500 mb-3">
            Escolha quais indicadores do relatório aparecem nos gráficos de evolução.
          </p>
          <div className="space-y-4">
            {grouped.map(([section, metrics]) => (
              <div key={section}>
                <p className="text-sm font-bold text-slate-700 mb-1">{section}</p>
                <div className="space-y-0.5">
                  {metrics.map((m) => (
                    <label key={m.key} className="flex items-center gap-1 text-sm text-slate-700 cursor-pointer">
                      <Checkbox
                        size="small"
                        checked={selected.has(m.key)}
                        onChange={() => toggle(m.key)}
                        sx={{ p: 0.5 }}
                      />
                      {m.name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setIsOpen(false)} color="inherit">
            Cancelar
          </MuiButton>
          <MuiButton onClick={handleSave} disabled={isSaving} variant="contained">
            {isSaving ? "Salvando..." : `Salvar seleção (${selected.size})`}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function IndicatorsPanel() {
  const fileInputRef = useRef(null);
  const [report, setReport] = useState(null);
  const [trackedKeys, setTrackedKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSeconds, setUploadSeconds] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    setIsLoading(true);
    try {
      const [latest, tracked] = await Promise.all([
        indicatorReportService.getLatest(),
        indicatorReportService.getTrackedMetrics(),
      ]);
      setReport(latest);
      setTrackedKeys(tracked.map((t) => t.metricKey));
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar relatório de indicadores.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    setError("");
    setNotice("");
    setIsUploading(true);
    setUploadSeconds(0);
    const timer = setInterval(() => setUploadSeconds((s) => s + 1), 1000);
    try {
      // 1. Extrai o texto do PDF no navegador (pdfjs).
      const { text, weekPeriods, weeklyByLabel } = await extractIndicatorPdf(file);
      if (!text.trim()) throw new Error("Não foi possível ler texto deste PDF.");

      // 2. Estrutura os indicadores com a IA (Edge Function + Gemini).
      const { data, error: fnError } = await supabase.functions.invoke("parse-indicator-report", {
        body: { pdfText: text, weekPeriods, weeklyByLabel },
      });

      if (fnError) {
        // O corpo real do erro (definido na Edge Function) fica em error.context.
        let detail = fnError.message;
        if (fnError.context && typeof fnError.context.json === "function") {
          try {
            const b = await fnError.context.json();
            if (b?.error) detail = b.error;
          } catch {
            /* corpo não era JSON */
          }
        }
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);

      // 3. Persiste (substitui o relatório anterior) e re-renderiza.
      const saved = await indicatorReportService.replace({
        fileName: file.name,
        partnerName: data.partnerName,
        location: data.location,
        metrics: data.metrics,
      });
      setReport(saved);
      setNotice(`Relatório importado! ${data.metrics.length} indicadores extraídos do PDF.`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro ao importar PDF.");
    } finally {
      clearInterval(timer);
      setIsUploading(false);
    }
  };

  const handleSaveTracked = async (metrics) => {
    try {
      await indicatorReportService.setTrackedMetrics(metrics);
      setTrackedKeys(metrics.map((m) => m.key));
      setNotice("Seleção de indicadores salva!");
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar seleção.");
    }
  };

  const trackedMetrics = useMemo(() => {
    if (!report) return [];
    const keySet = new Set(trackedKeys);
    return report.metrics.filter((m) => keySet.has(m.key));
  }, [report, trackedKeys]);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-2 flex flex-col gap-6">
      {/* Card de upload */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <FileUp className="h-5 w-5 text-indigo-500" /> Relatório de Performance (PDF)
        </h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Envie o PDF de indicadores da Samsung para atualizar os gráficos de evolução mensal e semanal.
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            id="indicator-pdf-input"
          />
          <label
            htmlFor="indicator-pdf-input"
            className={`inline-flex items-center gap-2 text-sm font-bold rounded-lg px-4 py-2.5 transition-colors ${
              isUploading
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-indigo-500 text-white hover:bg-indigo-600 cursor-pointer"
            }`}
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            {isUploading ? `Processando PDF... (${uploadSeconds}s)` : "Enviar PDF do relatório"}
          </label>
          {isUploading && (
            <p className="text-xs text-slate-500">
              A IA está lendo a tabela do relatório — isso costuma levar de 1 a 2 minutos, não feche esta aba.
            </p>
          )}
          {!isUploading && report && (
            <div className="text-xs text-slate-500 space-y-0.5">
              {report.partnerName && (
                <p className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> {report.partnerName}
                </p>
              )}
              {report.fileName && (
                <p className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> {report.fileName} · atualizado em{" "}
                  {report.uploadedAt.toLocaleString("pt-BR")}
                </p>
              )}
            </div>
          )}
        </div>
        {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}
        {notice && !error && <p className="mt-3 text-xs font-semibold text-emerald-600">{notice}</p>}
      </div>

      {isLoading ? (
        <div className="text-center p-8 text-slate-400 text-sm">Carregando...</div>
      ) : !report ? (
        <div className="bg-white border border-slate-200 rounded-2xl text-center text-slate-400 text-sm py-10">
          Nenhum relatório enviado ainda. Envie um PDF para gerar os gráficos de evolução.
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Gráficos de Evolução</h2>
            <TrackMetricsDialog report={report} trackedKeys={trackedKeys} onSave={handleSaveTracked} />
          </div>

          {trackedMetrics.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl text-center text-slate-400 text-sm py-10">
              Nenhum indicador selecionado ainda. Clique em "Escolher Indicadores" para montar os gráficos.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {trackedMetrics.map((metric) => (
                <MetricChartCard key={metric.key} metric={metric} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
