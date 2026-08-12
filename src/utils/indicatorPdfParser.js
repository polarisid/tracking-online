// Extração do PDF de indicadores no NAVEGADOR (pdfjs-dist).
//
// Porta de `extractPdfData` do smartos (que rodava no servidor). Como o
// tracking-online é um CRA sem backend, o parse geométrico do PDF roda aqui no
// cliente e só o texto extraído vai para a Edge Function (parse-indicator-report)
// chamar o Gemini.
//
// Faz DUAS coisas:
// 1. Um dump de texto linha-a-linha (por posição vertical) para a IA estruturar
//    semanticamente os indicadores.
// 2. SEPARADAMENTE, resolve os valores das "últimas semanas" de forma
//    determinística por posição x na página — as colunas de semana ficam bem à
//    direita, isoladas do bloco de meses por um vão grande (~200pt contra ~40pt
//    entre colunas normais); dá pra detectar esse vão e cortar ali, não importa
//    quantos meses aquela linha tem preenchidos. Isso corrige o erro comum da IA
//    de trazer semanas nulas ou misturadas com meses.

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

// Worker servido pelo unpkg na versão EXATA do pacote instalado — evita a dor de
// configurar worker no webpack do CRA e garante compatibilidade de versão.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.js`;

const PERIOD_RE = /^(\d{4})\.(\d{2})$/;
const VALUE_RE = /^-$|^R\$\s?[\d.,]+$|^[\d.,]+%?$/;
const NON_LABEL_TOKENS = new Set(["$", "↑", "↓"]);

function normalizeLabel(s) {
  return (s || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function parseNumberToken(raw) {
  const s = (raw || "").trim();
  if (s === "-" || s === "") return null;
  const cleaned = s.replace(/^R\$\s?/i, "").replace(/%$/, "").replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * Lê um File de PDF e devolve { text, weekPeriods, weeklyByLabel } pronto para
 * enviar à Edge Function. weeklyByLabel é um objeto simples (JSON-serializável),
 * indexado pelo rótulo normalizado da linha.
 */
export async function extractIndicatorPdf(file) {
  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer), verbosity: 0 }).promise;

  let fullText = "";
  let weekPeriods = [];
  const weeklyByLabel = {};

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const items = content.items
      .map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5] }))
      .filter((it) => it.str.trim() !== "");

    // Cabeçalho de período: meses têm "MM" <= 12, semanas (número ISO) > 12.
    const periodTokens = items.filter((it) => PERIOD_RE.test(it.str.trim()));
    if (periodTokens.length > 0) {
      const yCounts = new Map();
      periodTokens.forEach((t) => {
        const k = Math.round(t.y);
        yCounts.set(k, (yCounts.get(k) || 0) + 1);
      });
      const headerY = [...yCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      const headerRow = periodTokens.filter((t) => Math.abs(t.y - headerY) <= 3).sort((a, b) => a.x - b.x);
      const pageWeeks = headerRow.filter((t) => Number(t.str.trim().split(".")[1]) > 12).map((t) => t.str.trim());
      if (pageWeeks.length > weekPeriods.length) weekPeriods = pageWeeks;
    }

    items.sort((a, b) => b.y - a.y || a.x - b.x);

    const rows = [];
    let currentY = null;
    let currentRow = [];
    for (const it of items) {
      if (currentY === null || Math.abs(it.y - currentY) > 3) {
        if (currentRow.length) rows.push(currentRow);
        currentRow = [it];
        currentY = it.y;
      } else {
        currentRow.push(it);
      }
    }
    if (currentRow.length) rows.push(currentRow);

    for (const row of rows) {
      const sortedRow = [...row].sort((a, b) => a.x - b.x);
      fullText += sortedRow.map((i) => i.str).join("\t") + "\n";

      if (weekPeriods.length === 0) continue;
      const valueTokens = sortedRow.filter((it) => VALUE_RE.test(it.str.trim()));
      if (valueTokens.length < weekPeriods.length + 1) continue;

      let maxGap = -1;
      let splitIdx = -1;
      for (let i = 1; i < valueTokens.length; i++) {
        const gap = valueTokens[i].x - valueTokens[i - 1].x;
        if (gap > maxGap) {
          maxGap = gap;
          splitIdx = i;
        }
      }
      if (splitIdx === -1 || maxGap < 100) continue; // sem vão claro -> sem bloco semanal nesta linha
      const weekTokens = valueTokens.slice(splitIdx);
      if (weekTokens.length !== weekPeriods.length) continue;

      const labelTokens = sortedRow.filter(
        (it) => !VALUE_RE.test(it.str.trim()) && !NON_LABEL_TOKENS.has(it.str.trim()),
      );
      const label = normalizeLabel(labelTokens.map((t) => t.str).join(" "));
      if (!label) continue;

      weeklyByLabel[label] = weekTokens.map((t) => parseNumberToken(t.str));
    }
    fullText += "\n";
  }

  return { text: fullText, weekPeriods, weeklyByLabel };
}
