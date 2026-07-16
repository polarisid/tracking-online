import React, { useMemo } from 'react';
import { 
  Brain, Sparkles, MapPin, Truck, AlertTriangle, 
  Clock, Package, ArrowRight, UserCheck
} from 'lucide-react';
import filters from '../utils/filters';

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

export default function IntelligencePanel({ data1, activeRoutes }) {
  const today = useMemo(() => new Date(), []);

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
      const product = row[59] || row[9] || 'Aparelho';

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
          matchingRoutes
        });
      }
    });

    // Ordena as sugestões pelas ordens com maior aging days
    return suggestions.sort((a, b) => b.agingDays - a.agingDays);
  }, [data1, activeRoutes, routeOrdersSet]);

  // 3. Previsão de gargalos de entrega de peças
  const partsPredictions = useMemo(() => {
    if (!data1 || data1.length <= 1) return [];

    const dataRows = data1.slice(1);
    
    // Mapa para acumular tempos de entrega históricos por código de peça
    const partDelaysAccumulator = {};

    dataRows.forEach(row => {
      const partCode = row[61]; // parts_no01
      const requestStr = row[16]; // request_date
      const deliveryStr = row[27]; // goods_delivered_date
      const isIH = row[34] === 'IH';

      if (isIH && partCode && requestStr && deliveryStr) {
        const reqDate = parseDate(requestStr);
        const delDate = parseDate(deliveryStr);

        if (reqDate && delDate && delDate >= reqDate) {
          const diffDays = Math.round((delDate - reqDate) / (86400 * 1000));
          if (!partDelaysAccumulator[partCode]) {
            partDelaysAccumulator[partCode] = { totalDays: 0, count: 0 };
          }
          partDelaysAccumulator[partCode].totalDays += diffDays;
          partDelaysAccumulator[partCode].count += 1;
        }
      }
    });

    // Calcula a média para cada peça
    const partAvgDelays = {};
    Object.keys(partDelaysAccumulator).forEach(code => {
      const accum = partDelaysAccumulator[code];
      partAvgDelays[code] = Math.round(accum.totalDays / accum.count);
    });

    // Agora, busca peças que estão atualmente aguardando (OS ativas com partCode e sem data de entrega)
    const pendingPartsList = [];

    dataRows.forEach(row => {
      const orderId = row[1];
      const clientName = row[3] || 'Cliente';
      const partCode = row[61];
      const partDesc = row[59] || 'Peça de reposição';
      const requestStr = row[16];
      const deliveryStr = row[27];
      const isComplete = row[11] === 'ST035';
      const isIH = row[34] === 'IH';

      // Ativa, do tipo IH, tem código de peça, mas não tem data de entrega
      if (!isComplete && isIH && partCode && requestStr && (!deliveryStr || deliveryStr === '00/00/0000')) {
        const reqDate = parseDate(requestStr);
        if (reqDate) {
          const avgDelay = partAvgDelays[partCode] || 6; // fallback 6 dias se sem histórico
          const estDelivery = new Date(reqDate.getTime() + avgDelay * 86400 * 1000);
          
          const diffTime = today - estDelivery;
          const isOverdue = today > estDelivery;
          const daysOffset = Math.abs(Math.round(diffTime / (86400 * 1000)));

          pendingPartsList.push({
            orderId,
            clientName,
            partCode,
            partDesc,
            requestDate: requestStr,
            avgDelay,
            estimatedDelivery: estDelivery.toLocaleDateString('pt-BR'),
            isOverdue,
            daysOffset
          });
        }
      }
    });

    // Ordena colocando peças em atraso no topo
    return pendingPartsList.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return b.daysOffset - a.daysOffset;
    });
  }, [data1, today]);

  return (
    <div className="space-y-8 animate-fadeIn px-4 py-2">
      {/* Header do Painel */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/10 text-white shrink-0 self-start md:self-auto">
          <Brain size={28} />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            Módulo de Inteligência & Otimização
            <span className="text-[9px] uppercase font-bold px-2 py-0.5 bg-indigo-55 bg-indigo-50 text-indigo-600 border border-indigo-200/50 rounded-full tracking-wider">
              Operacional
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Cruzamento automático de dados de campo. Analisa locais de atendimento ativos para otimização de rotas e prevê a entrega de peças de fábrica com base em performance histórica.
          </p>
        </div>
      </div>

      {/* Grid de Seções */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Seção 1: Sugestões de Alocação */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col min-h-[500px] shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
              <Truck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Sugestões de Alocação de OS</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">LTPs fora de rota próximas a técnicos ativos</p>
            </div>
            <span className="ml-auto text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-650 text-slate-700">
              {allocationSuggestions.length}
            </span>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[550px] pr-1 flex-1">
            {allocationSuggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Sparkles size={36} className="text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-600">Tudo em dia!</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[240px]">
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
                      <span className="text-[10px] font-bold text-slate-400 font-mono">OS #{sug.orderId}</span>
                      <h4 className="text-xs font-bold text-slate-800 mt-0.5">{sug.clientName}</h4>
                      <p className="text-[10px] font-medium text-slate-500 mt-0.5">{sug.product}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase ${
                      sug.classification === 'EX LTP' 
                        ? 'bg-amber-100 text-amber-700 border border-amber-200/60' 
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-200/60'
                    }`}>
                      {sug.classification} ({sug.agingDays}d)
                    </span>
                  </div>

                  {/* Detalhes Localização */}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-600 mb-3 bg-slate-100/80 py-1 px-2 rounded-lg w-fit font-medium">
                    <MapPin size={12} className="text-slate-400" />
                    <span>{sug.city} {sug.neighborhood ? `— ${sug.neighborhood}` : ''}</span>
                  </div>

                  {/* Recomendações de Alocação */}
                  <div className="space-y-2 border-t border-slate-100 pt-2.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Técnicos Próximos Hoje:</p>
                    {sug.matchingRoutes.map((route, rIdx) => (
                      <div 
                        key={rIdx}
                        className="flex items-center justify-between bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1.5 transition-all text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <UserCheck size={14} className="text-indigo-550 text-indigo-600" />
                          <div>
                            <span className="font-bold text-slate-700">{route.technicianName}</span>
                            <span className="text-[9px] text-slate-400 block font-medium">{route.routeName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
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

        {/* Seção 2: Previsão de Gargalos de Peças */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col min-h-[500px] shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg border border-purple-100">
              <Package size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Rastreamento e Gargalos de Peças</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Previsões inteligentes de chegada de fábrica</p>
            </div>
            <span className="ml-auto text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {partsPredictions.length}
            </span>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[550px] pr-1 flex-1">
            {partsPredictions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package size={36} className="text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-600">Sem pendências de peças!</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[240px]">
                  Nenhuma ordem ativa está aguardando chegada de peças de fábrica neste momento.
                </p>
              </div>
            ) : (
              partsPredictions.map((pred, pIdx) => (
                <div 
                  key={pIdx}
                  className="bg-slate-50/40 border border-slate-200/50 hover:border-slate-300/80 hover:bg-slate-50 rounded-xl p-4 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">OS #{pred.orderId} — {pred.clientName}</span>
                      <h4 className="text-xs font-bold text-slate-800 mt-0.5">Peça: {pred.partCode}</h4>
                      <p className="text-[10px] font-medium text-slate-500 mt-0.5 truncate max-w-[190px] md:max-w-xs">{pred.partDesc}</p>
                    </div>

                    {pred.isOverdue ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center gap-1 uppercase tracking-wide shrink-0">
                        <AlertTriangle size={10} />
                        Atrasado {pred.daysOffset}d
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-55 bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center gap-1 uppercase tracking-wide shrink-0">
                        <Clock size={10} />
                        Previsão {pred.daysOffset}d
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-[10px]">
                    <div className="bg-slate-100/60 p-2 rounded-lg text-center">
                      <span className="text-slate-400 block uppercase font-bold text-[8px]">Solicitada</span>
                      <span className="font-bold text-slate-700 block mt-0.5">{pred.requestDate}</span>
                    </div>
                    <div className="bg-slate-100/60 p-2 rounded-lg text-center">
                      <span className="text-slate-400 block uppercase font-bold text-[8px]">Tempo Médio</span>
                      <span className="font-bold text-indigo-600 block mt-0.5">{pred.avgDelay} dias</span>
                    </div>
                    <div className="bg-slate-100/60 p-2 rounded-lg text-center">
                      <span className="text-slate-400 block uppercase font-bold text-[8px]">Est. Entrega</span>
                      <span className={`font-bold block mt-0.5 ${pred.isOverdue ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {pred.estimatedDelivery}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
