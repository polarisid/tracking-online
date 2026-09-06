// Gera a "leitura do dia" — o Tracking Online como aliado analítico do gestor:
// status geral + o que precisa de atenção + o que mais se moveu no período.
//
// Usa os MESMOS limiares do Status Geral do ExecutiveSummary, pra os dois
// concordarem (confiança = consistência).

function fmt(n) {
  return Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

/**
 * @param {object} input
 * @param {number} input.rtatVd  RTAT VD (dias)
 * @param {number} input.rtatDa  RTAT DA (dias)
 * @param {number} input.overdue Consumidores fora do prazo (quantity_Oudated_IH)
 * @param {number} input.daNoParts DA sem peça
 * @param {string|null} input.comparisonLabel "ontem" | "semana passada" | ... (ou null)
 * @param {Array<{label,value,diff,betterWhenLower}>} input.movers métricas com diff vs comparação
 * @returns {{ level, statusLabel, headline, movers }}
 */
export function buildInsights({ rtatVd = 0, rtatDa = 0, overdue = 0, daNoParts = 0, comparisonLabel = null, movers = [] }) {
  const issues = [];
  if (rtatDa > 5) issues.push(`RTAT DA em ${fmt(rtatDa)} dias, acima da meta`);
  if (rtatVd > 4) issues.push(`RTAT VD em ${fmt(rtatVd)} dias, acima da meta`);
  if (overdue > 10) issues.push(`${overdue} ordens fora do prazo`);
  if (daNoParts > 20) issues.push(`${daNoParts} DA sem peça`);

  let level, statusLabel;
  if (issues.length === 0) {
    level = "good";
    statusLabel = "Saudável";
  } else if (issues.length <= 2) {
    level = "warn";
    statusLabel = "Atenção";
  } else {
    level = "critical";
    statusLabel = "Crítico";
  }

  let headline;
  if (issues.length === 0) {
    headline = "Operação dentro das metas — sem alertas críticos no momento.";
  } else {
    const shown = issues.slice(0, 2);
    const rest = issues.length - shown.length;
    // Primeira letra maiúscula.
    const joined = shown.join(" · ");
    headline = joined.charAt(0).toUpperCase() + joined.slice(1) + (rest > 0 ? ` · +${rest} ponto${rest > 1 ? "s" : ""}` : "") + ".";
  }

  // Top 2 métricas que mais se moveram vs a comparação (ignora as sem variação).
  const topMovers = (comparisonLabel ? movers : [])
    .filter((m) => m.diff !== null && m.diff !== undefined && m.diff !== 0)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
    .slice(0, 2)
    .map((m) => ({
      label: m.label,
      diff: m.diff,
      // "melhora" depende da direção da métrica (backlog/RTAT caindo = bom).
      better: m.betterWhenLower ? m.diff < 0 : m.diff > 0,
    }));

  return { level, statusLabel, headline, movers: topMovers, comparisonLabel };
}
