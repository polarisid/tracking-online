import React, { useMemo, useState, useEffect } from 'react';
import {
  Brain, Sparkles, MapPin, Truck, AlertTriangle,
  Clock, ArrowRight, UserCheck,
  ListChecks, Loader2, Wand2, CircleCheck, Wrench, ShieldAlert,
  Copy, Check, Flame, TrendingUp, Gauge, Zap, Layers, Database, Quote
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import filters from '../utils/filters';
import { formatDateToDDMMYYYY } from '../utils/dateFomatter';
import { supabase } from '../lib/supabaseClient';
import { getCleanSourceName } from '../utils/dataSource';

const AI_CHECKLIST_CACHE_KEY = 'tracking_ai_checklist_cache';
const HISTORY_LOOKBACK_DAYS = 14;

/**
 * Hash curto e estável (FNV-1a) usado só para comparar payloads no cache local,
 * não para segurança.
 */
const hashString = (str) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
};

/**
 * Fingerprint do payload enviado à IA — muda sempre que os casos críticos
 * relevantes mudam, permitindo detectar quando o checklist pode ser reaproveitado.
 */
const computeChecklistFingerprint = (criticalCasesTop20, totals) => {
  const normalized = criticalCasesTop20
    .map(c => `${c.orderId}|${c.categories.join(',')}|${c.agingDays}`)
    .join(';');
  return hashString(`${normalized}::${JSON.stringify(totals)}`);
};

/**
 * Botão pequeno e reutilizável para copiar um número de OS com um clique.
 * Definido no escopo do módulo (não dentro de IntelligencePanel) — se ficasse
 * dentro, o React recriaria essa função a cada render do painel e trataria o
 * botão como um componente novo, desmontando/remontando o DOM real dele. Como
 * o painel tem vários efeitos assíncronos (snapshot, histórico, cache da IA)
 * disparando re-renders a qualquer momento, isso podia acontecer bem no meio
 * de um clique (entre mousedown e mouseup) e o navegador perdia o evento —
 * o botão parecia simplesmente não responder ao clique do mouse.
 */
const CopyOrderChip = ({ orderId, className = '', copiedOrderId, onCopy }) => {
  const isCopied = copiedOrderId === orderId;
  return (
    <button
      type="button"
      onClick={() => onCopy(orderId)}
      title="Clique para copiar o número da OS"
      className={`inline-flex items-center gap-1.5 font-mono font-extrabold rounded-lg border transition-all duration-150 active:scale-95 ${
        isCopied
          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
      } ${className}`}
    >
      {isCopied ? <Check size={11} /> : <Copy size={11} />}
      {isCopied ? 'Copiado!' : `OS #${orderId}`}
    </button>
  );
};

const STATUS_LABELS = {
  ST015: 'Acknowledge (ASC)',
  ST025: 'Engineer Assigned',
  ST030: 'Pending',
  ST035: 'Repair Completed',
};

const REASON_LABELS = {
  HE004: 'Appointment Date is set',
  HE005: 'Repair in progress',
};

const CATEGORY_META = {
  sem_reparo_iniciado: { label: 'Sem Reparo Iniciado', color: 'bg-rose-50 text-rose-700 border-rose-200/60' },
  status_incorreto_rota: { label: 'Status Incorreto em Rota', color: 'bg-amber-100 text-amber-700 border-amber-250/60' },
  sem_evolucao_sistema: { label: 'Sem Evolução no Sistema', color: 'bg-purple-50 text-purple-700 border-purple-200/60' },
  desatualizado: { label: 'Desatualizado', color: 'bg-slate-200 text-slate-700 border-slate-300/60' },
};

const SERVICE_TYPE_META = {
  IH: { label: 'IH', color: 'bg-blue-50 text-blue-700 border-blue-200/60' },
  II: { label: 'II', color: 'bg-purple-50 text-purple-700 border-purple-200/60' },
  SH: { label: 'SH', color: 'bg-teal-50 text-teal-700 border-teal-200/60' },
};

/**
 * Utilitário de normalização de strings para comparação flexível.
 */
const normalizeStr = (str) => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove acentos
};

/**
 * Converte data em string brasileira (DD/MM/YYYY) ou serial do Excel em objeto Date.
 */
const parseDate = (val) => {
  if (!val) return null;
  val = String(val).trim();
  if (val === '00/00/0000' || val.toLowerCase() === 'null') return null;

  // Se for código serial do Excel (número entre 30000 e 60000)
  const num = Number(val);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    return new Date((num - 25569) * 86400 * 1000);
  }

  // Se for no formato DD/MM/YYYY
  const parts = val.split('/');
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    let y = parseInt(parts[2], 10);
    if (y < 100) {
      y += 2000;
    }
    return new Date(y, m, d);
  }

  // Fallback ISO
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Retorna se o caso é EX LTP, LTP ou Normal.
 */
const getLtpClassification = (row) => {
  if (!row) return 'Normal';
  if (filters.filter_VD_EX_LTP_LP(row) || (filters.filter_REF_RAC_EX_LTP_LP && filters.filter_REF_RAC_EX_LTP_LP(row))) {
    return 'EX LTP';
  }
  if (
    filters.filter_VD_LTP_LP(row) ||
    filters.filter_REF_RAC_LTP_LP(row) ||
    filters.filter_WSM_LP_LTP(row) ||
    filters.filter_CI_VD_LTP_LP(row) ||
    filters.filter_CI_MX_LTP_LP(row)
  ) {
    return 'LTP';
  }
  return 'Normal';
};

export default function IntelligencePanel({ data1, activeRoutes, dataSource }) {
  const today = useMemo(() => new Date(), []);
  const cleanSource = useMemo(() => getCleanSourceName(dataSource), [dataSource]);

  // 1. Mapeamento de OS em rotas ativas (Set de cache rápido)
  const routeOrdersSet = useMemo(() => {
    const set = new Set();
    if (!activeRoutes || !Array.isArray(activeRoutes)) return set;
    activeRoutes.forEach(route => {
      route.stops?.forEach(s => {
        if (s.serviceOrder) set.add(String(s.serviceOrder).trim());
        if (s.ascJobNumber) set.add(String(s.ascJobNumber).trim());
      });
      route.serviceOrders?.forEach(o => {
        if (o.serviceOrderNumber) set.add(String(o.serviceOrderNumber).trim());
      });
    });
    return set;
  }, [activeRoutes]);

  // 1b. Detalhes ricos por OS vindos da API de rotas (observations, pendingReason, técnico) —
  // a API do SmartOS traz isso por ordem, mas o app só usava serviceOrderNumber até aqui.
  const routeOrderDetails = useMemo(() => {
    const map = new Map();
    if (!activeRoutes || !Array.isArray(activeRoutes)) return map;
    activeRoutes.forEach(route => {
      ['pendentes', 'finalizadas', 'a_fazer'].forEach(key => {
        route[key]?.forEach(o => {
          const id = String(o.serviceOrderNumber || '').trim();
          if (!id) return;
          const observations = String(o.observations || '').trim();
          map.set(id, {
            observations: observations.slice(0, 240),
            pendingReason: String(o.pendingReason || '').trim(),
            technicianName: o.technicianName || route.technicianName || '',
          });
        });
      });
    });
    return map;
  }, [activeRoutes]);

  // 2. Cálculo das sugestões de alocação de OS
  const allocationSuggestions = useMemo(() => {
    if (!data1 || data1.length <= 1) return [];

    const suggestions = [];
    const dataRows = data1.slice(1);

    // Filtra ordens de serviço ativas (não resolvidas), do tipo IH e fora de rota
    const activeCriticalOrders = dataRows.filter(row => {
      const isComplete = row[11] === 'ST035';
      if (isComplete) return false;

      // Apenas ordens do tipo de serviço IH
      const isIH = row[34] === 'IH';
      if (!isIH) return false;

      // Apenas "Engineer Assigned" (ST025) ou "Waiting for Confirmation from customer" (HP030)
      const isEngineerAssigned = row[11] === 'ST025';
      const isWaitingCustomer = row[13] === 'HP030';
      if (!isEngineerAssigned && !isWaitingCustomer) return false;

      const orderId = String(row[1] || '').trim();
      const jobNo = String(row[2] || '').trim();
      
      // Deve estar fora de rotas ativas
      const inRoute = routeOrdersSet.has(orderId) || routeOrdersSet.has(jobNo);
      if (inRoute) return false;

      // Deve ser LTP ou EX LTP
      const classification = getLtpClassification(row);
      return classification === 'LTP' || classification === 'EX LTP';
    });

    activeCriticalOrders.forEach(row => {
      const orderId = row[1];
      const clientName = row[3] || 'Cliente';
      const city = row[4] || '';
      const neighborhood = row[5] || '';
      const aging = Number(row[15]) || 0;
      const classification = getLtpClassification(row);
      const product = row[9] || 'Aparelho';

      const normCity = normalizeStr(city);
      const normNeighborhood = normalizeStr(neighborhood);

      const matchingRoutes = [];

      // Procura técnicos com rotas na mesma cidade/bairro
      activeRoutes.forEach(route => {
        let sameCity = false;
        let sameNeighborhood = false;

        route.stops?.forEach(stop => {
          if (normalizeStr(stop.city) === normCity) {
            sameCity = true;
            if (normNeighborhood && normalizeStr(stop.neighborhood) === normNeighborhood) {
              sameNeighborhood = true;
            }
          }
        });

        if (sameCity) {
          matchingRoutes.push({
            technicianName: route.technicianName || 'Técnico',
            routeName: route.name || 'Rota sem Nome',
            sameNeighborhood
          });
        }
      });

      if (matchingRoutes.length > 0) {
        // Ordena para colocar correspondências de bairro no topo
        matchingRoutes.sort((a, b) => (b.sameNeighborhood ? 1 : 0) - (a.sameNeighborhood ? 1 : 0));

        suggestions.push({
          orderId,
          clientName,
          city,
          neighborhood,
          agingDays: aging,
          classification,
          product,
          reason: row[14],
          matchingRoutes
        });
      }
    });

    // Ordena as sugestões pelas ordens com maior aging days
    return suggestions.sort((a, b) => b.agingDays - a.agingDays);
  }, [data1, activeRoutes, routeOrdersSet]);

  // 3. Ordens desatualizadas: IH, II ou SH com ASC Last Appointment Date anterior a hoje
  // (substitui temporariamente o card "Peças em Risco", desativado por hora)
  const outdatedOrders = useMemo(() => {
    if (!data1 || data1.length <= 1) return [];

    const dataRows = data1.slice(1);
    const VALID_SERVICE_TYPES = ['IH', 'II', 'SH'];
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const list = dataRows
      .filter(row => {
        const isComplete = row[11] === 'ST035';
        if (isComplete) return false;

        if (!VALID_SERVICE_TYPES.includes(row[34])) return false;

        const appointmentDate = parseDate(row[24]);
        if (!appointmentDate) return false;
        const appointmentOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
        return appointmentOnly < todayOnly;
      })
      .map(row => ({
        orderId: row[1],
        clientName: row[3] || 'Cliente',
        city: row[4] || '',
        neighborhood: row[5] || '',
        product: row[9] || 'Aparelho',
        serviceType: row[34],
        agingDays: Number(row[15]) || 0,
        statusLabel: STATUS_LABELS[row[11]] || row[11] || 'Desconhecido',
        ascLastAppointmentDate: row[24] || '',
      }));

    return list.sort((a, b) => b.agingDays - a.agingDays);
  }, [data1, today]);

  // 4. Casos críticos do dia: 4 regras de negócio + corte de Pareto (top 20%)
  const criticalCases = useMemo(() => {
    if (!data1 || data1.length <= 1) return { all: [], top20: [] };

    const todayForm = formatDateToDDMMYYYY(today);
    const dataRows = data1.slice(1);

    // Ordens já trabalhadas pelo técnico em campo (saíram de "a_fazer")
    const finalIds = new Set();
    const pendIds = new Set();
    if (Array.isArray(activeRoutes)) {
      activeRoutes.forEach(route => {
        route.finalizadas?.forEach(o => {
          if (o.serviceOrderNumber) finalIds.add(String(o.serviceOrderNumber).trim());
        });
        route.pendentes?.forEach(o => {
          if (o.serviceOrderNumber) pendIds.add(String(o.serviceOrderNumber).trim());
        });
      });
    }

    const casesMap = new Map();

    const addCategory = (row, category) => {
      const orderId = String(row[1] || '').trim();
      if (!orderId) return;
      if (!casesMap.has(orderId)) {
        const routeDetail = routeOrderDetails.get(orderId);
        casesMap.set(orderId, {
          orderId,
          clientName: row[3] || 'Cliente',
          city: row[4] || '',
          neighborhood: row[5] || '',
          product: row[9] || 'Aparelho',
          agingDays: Number(row[15]) || 0,
          statusLabel: STATUS_LABELS[row[11]] || row[11] || 'Desconhecido',
          reasonLabel: REASON_LABELS[row[13]] || row[14] || '—',
          ascLastAppointmentDate: row[24] || '',
          isToday: row[24] === todayForm,
          routeObservation: routeDetail?.observations || '',
          routePendingReason: routeDetail?.pendingReason || '',
          routeTechnicianName: routeDetail?.technicianName || '',
          categories: [],
        });
      }
      const entry = casesMap.get(orderId);
      if (!entry.categories.includes(category)) {
        entry.categories.push(category);
      }
    };

    dataRows.forEach(row => {
      const isComplete = row[11] === 'ST035';
      if (isComplete) return;

      // Apenas ordens do tipo de serviço IH (In-Home)
      if (row[34] !== 'IH') return;

      const orderId = String(row[1] || '').trim();
      const jobNo = String(row[2] || '').trim();
      const inRoute = routeOrdersSet.has(orderId) || routeOrdersSet.has(jobNo);

      // Regra 1: em rota, agendada para hoje, mas não está "Repair in progress"
      if (inRoute && row[24] === todayForm && row[13] !== 'HE005') {
        addCategory(row, 'sem_reparo_iniciado');
      }

      // Regra 2: em rota, não é hoje, mas não está "Appointment Date is set"
      if (inRoute && row[24] !== todayForm && row[13] !== 'HE004') {
        addCategory(row, 'status_incorreto_rota');
      }

      // Regra 3: técnico já classificou como pendente/finalizada em campo, mas sistema não evoluiu
      if (finalIds.has(orderId) || pendIds.has(orderId)) {
        addCategory(row, 'sem_evolucao_sistema');
      }

      // Regra 4: ordens desatualizadas (filtro já existente)
      if (filters.filter_all_outdated_orders(row)) {
        addCategory(row, 'desatualizado');
      }
    });

    const combined = Array.from(casesMap.values()).sort((a, b) => b.agingDays - a.agingDays);
    const top20Count = combined.length > 0 ? Math.ceil(combined.length * 0.2) : 0;

    return { all: combined, top20: combined.slice(0, top20Count) };
  }, [data1, activeRoutes, routeOrdersSet, routeOrderDetails, today]);

  // 4b. Grava um snapshot diário dos casos críticos (histórico p/ "fechar o ciclo").
  // Idempotente via UNIQUE(table_name, service_order_no, snapshot_day) + upsert —
  // não importa quantas vezes o painel carregue no mesmo dia, não duplica.
  useEffect(() => {
    if (!criticalCases.all.length || !cleanSource) return;

    const top20Ids = new Set(criticalCases.top20.map(c => c.orderId));
    const rows = criticalCases.all.map(c => ({
      table_name: cleanSource,
      service_order_no: String(c.orderId),
      client_name: c.clientName,
      city: c.city,
      categories: c.categories,
      aging_days: c.agingDays,
      status_label: c.statusLabel,
      is_pareto_top20: top20Ids.has(c.orderId),
    }));

    const BATCH_SIZE = 500;
    const saveSnapshot = async () => {
      try {
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const batch = rows.slice(i, i + BATCH_SIZE);
          const { error } = await supabase
            .from('critical_cases_snapshots')
            .upsert(batch, { onConflict: 'table_name,service_order_no,snapshot_day' });
          if (error) throw error;
        }
      } catch (err) {
        // Histórico é acessório — não deve incomodar o usuário se a tabela
        // ainda não existir ou a gravação falhar.
        console.error('[Inteligência] Falha ao gravar snapshot de casos críticos:', err.message || err);
      }
    };

    saveSnapshot();
  }, [criticalCases, cleanSource]);

  // 4c. Busca o histórico de snapshots (últimos dias) para calcular tendência e
  // quantos casos foram resolvidos/surgiram desde o snapshot anterior.
  const [casesHistory, setCasesHistory] = useState({ loaded: false, available: false, trend: [], resolvedCount: 0, newCount: 0 });

  useEffect(() => {
    if (!cleanSource) return;

    const loadHistory = async () => {
      try {
        const since = new Date();
        since.setDate(since.getDate() - HISTORY_LOOKBACK_DAYS);
        const sinceStr = since.toISOString().slice(0, 10);

        const { data, error } = await supabase
          .from('critical_cases_snapshots')
          .select('snapshot_day, service_order_no')
          .eq('table_name', cleanSource)
          .gte('snapshot_day', sinceStr)
          .order('snapshot_day', { ascending: true });

        if (error) throw error;

        const byDay = new Map();
        (data || []).forEach(row => {
          if (!byDay.has(row.snapshot_day)) byDay.set(row.snapshot_day, new Set());
          byDay.get(row.snapshot_day).add(row.service_order_no);
        });

        const days = Array.from(byDay.keys()).sort();
        const trend = days.map(day => ({ day: day.slice(5), count: byDay.get(day).size }));

        let resolvedCount = 0;
        let newCount = 0;
        if (days.length >= 2) {
          const previousSet = byDay.get(days[days.length - 2]);
          const latestSet = byDay.get(days[days.length - 1]);
          previousSet.forEach(id => { if (!latestSet.has(id)) resolvedCount++; });
          latestSet.forEach(id => { if (!previousSet.has(id)) newCount++; });
        }

        setCasesHistory({ loaded: true, available: days.length >= 2, trend, resolvedCount, newCount });
      } catch (err) {
        console.error('[Inteligência] Falha ao carregar histórico de casos críticos:', err.message || err);
        setCasesHistory({ loaded: true, available: false, trend: [], resolvedCount: 0, newCount: 0 });
      }
    };

    loadHistory();
  }, [cleanSource, criticalCases]);

  // 5. Checklist de ações gerado por IA (Gemini via Supabase Edge Function)
  const [aiChecklist, setAiChecklist] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiGeneratedAt, setAiGeneratedAt] = useState(null);
  const [aiFromCache, setAiFromCache] = useState(false);

  const checklistTotals = useMemo(() => {
    const byCategory = {};
    criticalCases.all.forEach(item => {
      item.categories.forEach(cat => {
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      });
    });
    return { totalCritical: criticalCases.all.length, byCategory };
  }, [criticalCases]);

  const checklistFingerprint = useMemo(
    () => computeChecklistFingerprint(criticalCases.top20, checklistTotals),
    [criticalCases, checklistTotals]
  );

  // Hidrata o checklist a partir do cache local sempre que o fingerprint bater
  // (ao montar, ou quando os casos críticos mudam e coincidem com um cache salvo)
  useEffect(() => {
    try {
      const cachedRaw = localStorage.getItem(AI_CHECKLIST_CACHE_KEY);
      if (!cachedRaw) return;
      const cached = JSON.parse(cachedRaw);
      if (cached?.fingerprint === checklistFingerprint && Array.isArray(cached.checklist)) {
        setAiChecklist(cached.checklist);
        setAiGeneratedAt(cached.generatedAt ? new Date(cached.generatedAt) : null);
        setAiFromCache(true);
      }
    } catch {
      // cache corrompido, ignora
    }
  }, [checklistFingerprint]);

  const handleGenerateChecklist = async () => {
    setAiError(null);

    // Se os dados não mudaram desde a última geração, reaproveita o cache local
    // em vez de gastar uma chamada à IA.
    try {
      const cachedRaw = localStorage.getItem(AI_CHECKLIST_CACHE_KEY);
      const cached = cachedRaw ? JSON.parse(cachedRaw) : null;
      if (cached?.fingerprint === checklistFingerprint && Array.isArray(cached.checklist)) {
        setAiChecklist(cached.checklist);
        setAiGeneratedAt(cached.generatedAt ? new Date(cached.generatedAt) : new Date());
        setAiFromCache(true);
        return;
      }
    } catch {
      // cache corrompido, segue para gerar de novo
    }

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-scenario', {
        body: {
          criticalCases: criticalCases.top20.slice(0, 25),
          totals: checklistTotals,
        },
      });

      if (error) {
        // supabase-js só traz uma mensagem genérica em `error.message` quando a
        // function responde com status != 2xx. O corpo real do erro (definido em
        // supabase/functions/analyze-scenario/index.ts) fica em `error.context`.
        let detail = error.message;
        if (error.context && typeof error.context.json === 'function') {
          try {
            const body = await error.context.json();
            if (body?.error) detail = body.error;
          } catch {
            // corpo não era JSON, mantém a mensagem genérica
          }
        }
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);

      const checklist = data.checklist || [];
      const generatedAt = new Date();
      setAiChecklist(checklist);
      setAiGeneratedAt(generatedAt);
      setAiFromCache(false);

      try {
        localStorage.setItem(AI_CHECKLIST_CACHE_KEY, JSON.stringify({
          fingerprint: checklistFingerprint,
          checklist,
          generatedAt: generatedAt.toISOString(),
        }));
      } catch {
        // localStorage indisponível/cheio — segue sem cache, não é crítico
      }
    } catch (err) {
      console.error('Erro ao gerar checklist com IA:', err);
      setAiError(err.message || 'Falha ao gerar checklist. Tente novamente.');
    } finally {
      setAiLoading(false);
    }
  };

  // Aba ativa do painel ('acao' = Casos Críticos + Checklist IA, 'dados' = Alocação + Peças)
  const [activeTab, setActiveTab] = useState('acao');

  // Cópia rápida de números de OS com feedback visual
  const [copiedOrderId, setCopiedOrderId] = useState(null);

  // Fallback para contextos sem Clipboard API (HTTP não-localhost, navegadores antigos,
  // permissão negada) — sem isso, o clique não fazia nada visível em ambientes assim.
  const legacyCopyToClipboard = (text) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.top = '0';
      textarea.style.left = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  };

  const handleCopyOrderId = (orderId) => {
    if (!orderId) return;
    const text = String(orderId);

    const markCopied = () => {
      setCopiedOrderId(orderId);
      setTimeout(() => {
        setCopiedOrderId((prev) => (prev === orderId ? null : prev));
      }, 1500);
    };

    const hasClipboardApi = typeof navigator !== 'undefined'
      && navigator.clipboard
      && typeof navigator.clipboard.writeText === 'function'
      && window.isSecureContext;

    if (hasClipboardApi) {
      navigator.clipboard.writeText(text)
        .then(markCopied)
        .catch(() => {
          if (legacyCopyToClipboard(text)) markCopied();
        });
    } else if (legacyCopyToClipboard(text)) {
      markCopied();
    }
  };

  const PRIORITY_META = {
    alta: { label: 'Alta', icon: Flame, badge: 'bg-rose-50 text-rose-700 border-rose-200/60', bar: 'border-l-rose-400' },
    media: { label: 'Média', icon: TrendingUp, badge: 'bg-amber-100 text-amber-700 border-amber-250/60', bar: 'border-l-amber-400' },
    baixa: { label: 'Baixa', icon: Gauge, badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', bar: 'border-l-emerald-400' },
  };

  const CATEGORY_ICON = {
    sem_reparo_iniciado: Wrench,
    status_incorreto_rota: ShieldAlert,
    sem_evolucao_sistema: Truck,
    desatualizado: Clock,
  };

  // KPIs de resumo para o topo da página (dashboard)
  const KPI_CARDS = [
    {
      id: 'criticos',
      label: 'Ação Imediata Hoje',
      value: criticalCases.top20.length,
      sub: `de ${criticalCases.all.length} casos críticos`,
      icon: ShieldAlert,
      accent: 'from-rose-500 to-rose-600',
      tab: 'acao',
    },
    {
      id: 'checklist',
      label: 'Checklist IA',
      value: aiChecklist ? aiChecklist.length : '—',
      sub: aiChecklist ? 'ações geradas' : 'clique em gerar',
      icon: ListChecks,
      accent: 'from-indigo-500 to-purple-600',
      tab: 'acao',
    },
    {
      id: 'alocacao',
      label: 'Sugestões de Alocação',
      value: allocationSuggestions.length,
      sub: 'LTPs fora de rota',
      icon: Truck,
      accent: 'from-blue-500 to-blue-600',
      tab: 'dados',
    },
    {
      id: 'desatualizadas',
      label: 'Ordens Desatualizadas',
      value: outdatedOrders.length,
      sub: 'IH · II · SH',
      icon: Clock,
      accent: 'from-amber-500 to-orange-600',
      tab: 'dados',
    },
  ];

  const TABS = [
    { id: 'acao', label: 'Ação Agora', icon: Zap },
    { id: 'dados', label: 'Alocação & Peças', icon: Layers },
  ];

  return (
    <div className="space-y-6 animate-fadeIn px-4 py-2">
      {/* Header do Painel */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/10 text-white shrink-0 self-start md:self-auto">
          <Brain size={28} />
        </div>
        <div>
          <h2 className="text-base md:text-lg font-extrabold text-slate-800 flex items-center gap-2">
            Módulo de Inteligência & Otimização
            <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 bg-indigo-55 bg-indigo-50 text-indigo-600 border border-indigo-200/50 rounded-full tracking-wider">
              Operacional
            </span>
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-3xl">
            Cruzamento automático de dados de campo. Analisa locais de atendimento ativos para otimização de rotas e identifica ordens desatualizadas por tipo de atendimento.
          </p>
        </div>
      </div>

      {/* Barra de KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <button
              key={kpi.id}
              type="button"
              onClick={() => setActiveTab(kpi.tab)}
              className={`text-left bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 ${
                activeTab === kpi.tab ? 'border-indigo-200' : 'border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${kpi.accent} text-white shadow-sm`}>
                  <KpiIcon size={16} />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-none">{kpi.value}</p>
              <p className="text-[11px] md:text-xs font-extrabold text-slate-700 mt-2">{kpi.label}</p>
              <p className="text-[10px] md:text-[11px] text-slate-400 font-semibold mt-0.5">{kpi.sub}</p>
            </button>
          );
        })}
      </div>

      {/* Navegação em abas */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl w-fit">
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 text-xs md:text-sm font-extrabold px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <TabIcon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Aba: Alocação & Peças */}
      {activeTab === 'dados' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Seção 1: Sugestões de Alocação */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col min-h-[500px] shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <Truck size={18} />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-extrabold text-slate-900">Sugestões de Alocação de OS</h3>
              <p className="text-[11px] md:text-xs text-slate-500 font-medium mt-0.5">LTPs fora de rota próximas a técnicos ativos</p>
            </div>
            <span className="ml-auto text-xs md:text-sm font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {allocationSuggestions.length}
            </span>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[550px] pr-1 flex-1">
            {allocationSuggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Sparkles size={36} className="text-slate-300 mb-2" />
                <p className="text-xs md:text-sm font-bold text-slate-650">Tudo em dia!</p>
                <p className="text-[10px] md:text-xs text-slate-400 mt-1 max-w-[240px]">
                  Não encontramos ordens LTP fora de rota nas mesmas regiões dos técnicos hoje.
                </p>
              </div>
            ) : (
              allocationSuggestions.map((sug) => (
                <div 
                  key={sug.orderId}
                  className="bg-slate-50/40 border border-slate-200/50 hover:border-slate-300/80 hover:bg-slate-50 rounded-xl p-4 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10.5px] md:text-[11px] font-bold text-slate-500 font-mono">OS #{sug.orderId}</span>
                      <h4 className="text-xs md:text-sm font-extrabold text-slate-900 mt-0.5">{sug.clientName}</h4>
                      <p className="text-[10.5px] md:text-xs font-semibold text-slate-600 mt-0.5">{sug.product}</p>
                    </div>
                    <span className={`text-[9.5px] md:text-[10px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wide uppercase ${
                      sug.classification === 'EX LTP' 
                        ? 'bg-amber-100 text-amber-700 border border-amber-250/60' 
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-250/60'
                    }`}>
                      {sug.classification} ({sug.agingDays}d)
                    </span>
                  </div>

                  {/* Detalhes Localização e Motivo */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <div className="flex items-center gap-1.5 text-[10.5px] md:text-xs text-slate-700 bg-slate-105 bg-slate-100 py-1 px-2 rounded-lg font-bold border border-slate-200/50">
                      <MapPin size={12} className="text-slate-500" />
                      <span>{sug.city} {sug.neighborhood ? `— ${sug.neighborhood}` : ''}</span>
                    </div>
                    {sug.reason && (
                      <div className="flex items-center gap-1.5 text-[10.5px] md:text-xs text-slate-700 bg-slate-105 bg-slate-100 py-1 px-2 rounded-lg font-semibold border border-slate-200/50">
                        <span className="font-extrabold text-indigo-700">Motivo:</span>
                        <span className="truncate max-w-[200px] md:max-w-[300px]" title={sug.reason}>{sug.reason}</span>
                      </div>
                    )}
                  </div>

                  {/* Recomendações de Alocação */}
                  <div className="space-y-2 border-t border-slate-100 pt-2.5">
                    <p className="text-[9.5px] md:text-[10px] font-extrabold text-slate-450 uppercase tracking-widest text-center mb-1">Técnicos Próximos Hoje</p>
                    {sug.matchingRoutes.map((route, rIdx) => (
                      <div 
                        key={rIdx}
                        className="flex items-center justify-between bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1.5 transition-all text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <UserCheck size={14} className="text-indigo-650 text-indigo-600" />
                          <div>
                            <span className="text-xs md:text-sm font-extrabold text-slate-800">{route.technicianName}</span>
                            <span className="text-[9.5px] md:text-[10px] text-slate-550 text-slate-500 block font-semibold mt-0.5">{route.routeName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className={`text-[9.5px] md:text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            route.sameNeighborhood 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                          }`}>
                            {route.sameNeighborhood ? 'Mesmo Bairro' : 'Mesma Cidade'}
                          </span>
                          <ArrowRight size={12} className="text-slate-400 ml-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Seção 2: Ordens Desatualizadas (Peças em Risco desativado temporariamente) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col min-h-[500px] shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-extrabold text-slate-900">Ordens Desatualizadas</h3>
              <p className="text-[11px] md:text-xs text-slate-500 font-medium mt-0.5">IH, II e SH com agendamento (ASC Last Appointment Date) vencido</p>
            </div>
            <span className="ml-auto text-xs md:text-sm font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {outdatedOrders.length}
            </span>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[550px] pr-1 flex-1">
            {outdatedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <CircleCheck size={36} className="text-emerald-300 mb-2" />
                <p className="text-xs md:text-sm font-bold text-slate-650">Tudo em dia!</p>
                <p className="text-[10px] md:text-xs text-slate-400 mt-1 max-w-[240px]">
                  Nenhuma ordem IH, II ou SH com agendamento vencido no momento.
                </p>
              </div>
            ) : (
              outdatedOrders.map((order) => {
                const typeMeta = SERVICE_TYPE_META[order.serviceType] || { label: order.serviceType || '—', color: 'bg-slate-100 text-slate-700 border-slate-200' };
                return (
                  <div
                    key={order.orderId}
                    className="bg-slate-50/40 border border-slate-200/50 hover:border-slate-300/80 hover:bg-slate-50 rounded-xl p-4 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <CopyOrderChip orderId={order.orderId} className="text-[10px] px-2 py-0.5" copiedOrderId={copiedOrderId} onCopy={handleCopyOrderId} />
                        <h4 className="text-xs md:text-sm font-extrabold text-slate-900 mt-1.5">{order.clientName}</h4>
                        <p className="text-[10.5px] md:text-xs font-semibold text-slate-600 mt-0.5">{order.product}</p>
                      </div>
                      <span className="text-[9.5px] md:text-[10px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wide uppercase bg-rose-50 text-rose-600 border border-rose-200/60 shrink-0">
                        {order.agingDays}d
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-[9.5px] md:text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide border ${typeMeta.color}`}>
                        {typeMeta.label}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10.5px] md:text-xs text-slate-700 bg-slate-100 py-1 px-2 rounded-lg font-bold border border-slate-200/50">
                        <MapPin size={12} className="text-slate-500" />
                        <span>{order.city} {order.neighborhood ? `— ${order.neighborhood}` : ''}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10.5px] md:text-xs text-slate-700 bg-slate-100 py-1 px-2 rounded-lg font-semibold border border-slate-200/50 w-fit">
                      <span className="font-extrabold text-indigo-700">Status:</span>
                      <span>{order.statusLabel}</span>
                      <span className="text-slate-400">·</span>
                      <span>Agendado: {order.ascLastAppointmentDate || '—'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
      )}

      {/* Aba: Ação Agora */}
      {activeTab === 'acao' && (
      <div className="space-y-8">

      {/* Seção: Evolução dos Casos Críticos (histórico automático, sem marcação manual) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
            <TrendingUp size={18} />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-extrabold text-slate-900">Evolução dos Casos Críticos</h3>
            <p className="text-[11px] md:text-xs text-slate-500 font-medium mt-0.5">
              Comparação automática entre snapshots diários — ninguém precisa marcar nada
            </p>
          </div>
        </div>

        {!casesHistory.loaded ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="text-slate-300 animate-spin" />
          </div>
        ) : !casesHistory.available ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Database size={28} className="text-slate-300 mb-2" />
            <p className="text-xs md:text-sm font-bold text-slate-600">Ainda coletando histórico</p>
            <p className="text-[10px] md:text-xs text-slate-400 mt-1 max-w-sm">
              Volte amanhã para ver quantos casos foram resolvidos. Se a tabela de histórico ainda não existir no Supabase, esses dados não são gravados.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-4">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                  <CircleCheck size={18} />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-extrabold text-emerald-700 leading-none">{casesHistory.resolvedCount}</p>
                  <p className="text-[10px] md:text-xs font-bold text-emerald-700/80 mt-1">Resolvidos desde ontem</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-rose-50/60 border border-rose-200/60 rounded-xl p-4">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-extrabold text-rose-700 leading-none">{casesHistory.newCount}</p>
                  <p className="text-[10px] md:text-xs font-bold text-rose-700/80 mt-1">Novos desde ontem</p>
                </div>
              </div>
            </div>

            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={casesHistory.trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="criticalTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={(value) => [`${value} casos`, 'Total']} labelFormatter={(label) => `Dia ${label}`} />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#criticalTrendFill)" dot={{ r: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Seção 3: Casos Críticos do Dia (Top 20% - Pareto) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-extrabold text-slate-900">Casos Críticos do Dia</h3>
            <p className="text-[11px] md:text-xs text-slate-500 font-medium mt-0.5">
              Top 20% por dias pendentes — reparo não iniciado, status incorreto em rota, sem evolução no sistema e ordens desatualizadas
            </p>
          </div>
          <span className="ml-auto text-xs md:text-sm font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {criticalCases.top20.length} / {criticalCases.all.length}
          </span>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[550px] pr-1">
          {criticalCases.top20.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CircleCheck size={32} className="text-emerald-300 mb-2" />
              <p className="text-xs md:text-sm font-bold text-slate-600">Nenhum caso crítico identificado hoje.</p>
            </div>
          ) : (
            criticalCases.top20.map((item) => (
              <div
                key={item.orderId}
                className="bg-slate-50/40 border border-slate-200/50 hover:border-slate-300/80 hover:bg-slate-50 rounded-xl p-4 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <CopyOrderChip orderId={item.orderId} className="text-[10px] px-2 py-0.5" copiedOrderId={copiedOrderId} onCopy={handleCopyOrderId} />
                    <h4 className="text-xs md:text-sm font-extrabold text-slate-900 mt-1.5">{item.clientName}</h4>
                    <p className="text-[10.5px] md:text-xs font-semibold text-slate-600 mt-0.5">{item.product}</p>
                  </div>
                  <span className="text-[9.5px] md:text-[10px] font-extrabold px-2.5 py-0.5 rounded-full tracking-wide uppercase bg-slate-200 text-slate-700 border border-slate-300/60 shrink-0">
                    {item.agingDays}d
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-[10.5px] md:text-xs text-slate-700 bg-slate-100 py-1 px-2 rounded-lg font-bold border border-slate-200/50">
                    <MapPin size={12} className="text-slate-500" />
                    <span>{item.city} {item.neighborhood ? `— ${item.neighborhood}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10.5px] md:text-xs text-slate-700 bg-slate-100 py-1 px-2 rounded-lg font-semibold border border-slate-200/50">
                    <span className="font-extrabold text-indigo-700">Status:</span>
                    <span>{item.statusLabel} · {item.reasonLabel}</span>
                  </div>
                </div>

                {(item.routeObservation || item.routePendingReason) && (
                  <div className="flex items-start gap-2 bg-amber-50/60 border border-amber-200/50 rounded-lg px-2.5 py-2 mb-2 text-[10.5px] md:text-xs text-amber-900">
                    <Quote size={12} className="text-amber-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      {(item.routePendingReason || item.routeTechnicianName) && (
                        <span className="font-extrabold uppercase tracking-wide text-[9px] text-amber-700 block mb-0.5">
                          {item.routePendingReason}
                          {item.routePendingReason && item.routeTechnicianName ? ' · ' : ''}
                          {item.routeTechnicianName}
                        </span>
                      )}
                      {item.routeObservation && <span className="font-medium">{item.routeObservation}</span>}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {item.categories.map((cat) => (
                    <span
                      key={cat}
                      className={`text-[9.5px] md:text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide border ${CATEGORY_META[cat]?.color || 'bg-slate-100 text-slate-700 border-slate-200'}`}
                    >
                      {CATEGORY_META[cat]?.label || cat}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Seção 4: Checklist de Ações Gerado por IA */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              <ListChecks size={18} />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-extrabold text-slate-900">Checklist de Ações (IA)</h3>
              <p className="text-[11px] md:text-xs text-slate-500 font-medium mt-0.5">
                Analisa os casos críticos acima e sugere os próximos passos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateChecklist}
            disabled={aiLoading || criticalCases.top20.length === 0}
            className="ml-auto flex items-center gap-2 text-xs md:text-sm font-extrabold px-4 py-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            {aiLoading ? 'Gerando...' : aiChecklist ? 'Gerar Novamente' : 'Gerar Checklist com IA'}
          </button>
        </div>

        {aiError && (
          <div className="flex items-start gap-2 bg-rose-50 border border-rose-200/60 text-rose-700 rounded-xl p-3 text-xs md:text-sm font-semibold mb-4">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{aiError}</span>
          </div>
        )}

        {!aiChecklist && !aiLoading && !aiError && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles size={32} className="text-slate-300 mb-2" />
            <p className="text-xs md:text-sm font-bold text-slate-600">Nenhum checklist gerado ainda</p>
            <p className="text-[10px] md:text-xs text-slate-400 mt-1 max-w-sm">
              Clique em "Gerar Checklist com IA" para transformar os casos críticos acima em uma lista de ações práticas.
            </p>
          </div>
        )}

        {aiLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 size={28} className="text-indigo-400 animate-spin mb-2" />
            <p className="text-xs md:text-sm font-bold text-slate-600">Analisando cenário com IA...</p>
          </div>
        )}

        {aiChecklist && !aiLoading && (
          <>
            {aiGeneratedAt && (
              <p className="text-[10px] text-slate-400 font-semibold mb-3 flex items-center gap-1.5">
                <span>Gerado às {aiGeneratedAt.toLocaleTimeString('pt-BR')}</span>
                {aiFromCache && (
                  <span className="inline-flex items-center gap-1 text-slate-400 italic">
                    <Database size={10} />
                    (dados inalterados desde a última geração)
                  </span>
                )}
              </p>
            )}
            {aiChecklist.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CircleCheck size={32} className="text-emerald-300 mb-2" />
                <p className="text-xs md:text-sm font-bold text-slate-600">Nenhuma ação crítica identificada pela IA.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aiChecklist.map((item, idx) => {
                  const CategoryIconComp = CATEGORY_ICON[item.category] || ListChecks;
                  const priorityMeta = PRIORITY_META[item.priority] || PRIORITY_META.baixa;
                  const PriorityIconComp = priorityMeta.icon;
                  const categoryColor = CATEGORY_META[item.category]?.color || 'bg-slate-100 text-slate-700 border-slate-200';

                  return (
                    <div
                      key={idx}
                      className={`group flex items-start gap-3 bg-white border border-slate-200/70 border-l-4 ${priorityMeta.bar} hover:shadow-md hover:border-slate-300 rounded-xl p-4 transition-all duration-200`}
                    >
                      {/* Número do passo */}
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        {idx + 1}
                      </div>

                      {/* Ícone de categoria */}
                      <div className={`p-2 rounded-lg border shrink-0 ${categoryColor}`}>
                        <CategoryIconComp size={16} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs md:text-sm font-extrabold text-slate-900">{item.title}</h4>
                          <span className={`flex items-center gap-1 text-[9.5px] md:text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide border shrink-0 ${priorityMeta.badge}`}>
                            <PriorityIconComp size={11} />
                            {priorityMeta.label}
                          </span>
                        </div>
                        <p className="text-[10.5px] md:text-xs text-slate-600 font-medium mt-1">{item.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2.5">
                          {CATEGORY_META[item.category] && (
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide border ${categoryColor}`}>
                              {CATEGORY_META[item.category].label}
                            </span>
                          )}
                          {item.relatedOrderId && (
                            <CopyOrderChip orderId={item.relatedOrderId} className="text-[10px] px-2 py-0.5" copiedOrderId={copiedOrderId} onCopy={handleCopyOrderId} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      </div>
      )}
    </div>
  );
}
