// Supabase Edge Function (Deno) — estrutura os indicadores de um relatório de
// performance Samsung (PDF de KPI) a partir do TEXTO já extraído no cliente.
//
// Diferente do smartos (que extraía o PDF no servidor com pdfjs), aqui o
// tracking-online é um CRA sem backend: o pdfjs roda no navegador e manda pra cá
// só o dump de texto + os períodos de semana + os valores semanais já resolvidos
// por posição na página (weeklyByLabel). Esta função só cuida da parte de IA.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Mesmo modelo já em uso e comprovado na função analyze-scenario deste repo.
const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    partnerName: { type: "STRING" },
    location: { type: "STRING" },
    monthPeriods: { type: "ARRAY", items: { type: "STRING" } },
    weekPeriods: { type: "ARRAY", items: { type: "STRING" } },
    metrics: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          section: { type: "STRING" },
          name: { type: "STRING" },
          unit: { type: "STRING", enum: ["percent", "currency", "number"] },
          meta: { type: "NUMBER", nullable: true },
          direction: { type: "STRING", enum: ["up", "down", "none"] },
          monthly: { type: "ARRAY", items: { type: "NUMBER", nullable: true } },
          weekly: { type: "ARRAY", items: { type: "NUMBER", nullable: true } },
        },
        required: ["section", "name", "unit", "direction", "monthly", "weekly"],
        propertyOrdering: ["section", "name", "unit", "meta", "direction", "monthly", "weekly"],
      },
    },
  },
  required: ["monthPeriods", "weekPeriods", "metrics"],
};

const SYSTEM_PROMPT = `
  Você recebe um dump de texto extraído de um PDF de relatório de performance de parceiro Samsung (planilha de
  indicadores/KPI). O texto foi extraído linha por linha (colunas separadas por tabulação), mas a ORDEM das
  colunas dentro de cada linha pode não seguir a ordem visual esperada (esquerda-para-direita) - use o contexto
  (rótulos como "MX (%)", "VD (Qty)", nomes de seção como "FTC", "LTP", "Velocidade", símbolos "↑"/"↓"/"$", e os
  cabeçalhos de período) para remontar corretamente cada indicador.

  A tabela tem colunas de período: meses no formato "AAAA.MM" e, no final, semanas no formato "AAAA.SS" (número
  da semana ISO). As linhas são agrupadas por seção (rótulo que aparece perto das linhas, ex: "Volumetria",
  "LTP", "ex-LTP", "FTC", "Velocidade", "Perfeição", "Peças", "Qualidade", "Abertura de Tickets").

  Regras de conversão de números:
  - Formato brasileiro: vírgula é separador decimal, ponto é separador de milhar (ex: "1.227" = 1227, "6,95%" = 6.95).
  - Remova os símbolos "%" e "R$" - retorne só o número.
  - "-" ou célula ausente vira null.

  Regras de extração:
  - "unit": "percent" se a linha tem valores com "%", "currency" se tem "R$", senão "number".
  - "direction": "up" se houver "↑" associado à linha, "down" se houver "↓", "none" caso contrário.
  - "meta": valor da coluna "Meta" da linha (geralmente um número isolado antes ou depois dos valores de
    período), ou null se ausente/"-".
  - "monthPeriods"/"weekPeriods": os rótulos de período encontrados no cabeçalho, na ordem.
  - Cada indicador deve ter "monthly" com o mesmo número de valores que "monthPeriods" e "weekly" com o mesmo
    número de valores que "weekPeriods", na mesma ordem dos períodos. Use null onde não houver valor correspondente.
  - NÃO pule nenhuma linha de indicador presente no texto. NÃO invente linhas que não estão no texto.
  - IMPORTANTE: todo número no JSON de saída deve ser um número JSON válido, sem vírgula, sem "%", sem "R$".
`;

interface RequestBody {
  pdfText?: string;
  // Períodos de semana detectados geometricamente no cliente (ground-truth).
  weekPeriods?: string[];
  // Valores semanais já resolvidos por posição x na página, indexados pelo
  // rótulo normalizado da linha. Ver indicatorPdfParser.js no frontend.
  weeklyByLabel?: Record<string, (number | null)[]>;
}

function normalizeLabel(s: string): string {
  return (s || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

const slugify = (s: string) =>
  (s || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não suportado" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY não configurada nas secrets da function.");
    return new Response(JSON.stringify({ error: "IA não configurada no servidor." }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Corpo da requisição inválido (JSON esperado)." }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const pdfText = (body?.pdfText || "").trim();
  if (!pdfText) {
    return new Response(JSON.stringify({ error: "Não foi possível ler texto deste PDF." }), {
      status: 422,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const detectedWeekPeriods = Array.isArray(body.weekPeriods) ? body.weekPeriods : [];
  const weeklyByLabel = body.weeklyByLabel || {};

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              role: "user",
              parts: [
                { text: `Texto extraído do PDF:\n\n${pdfText}` },
                { text: "Estruture todos os indicadores deste texto em JSON conforme o schema." },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
            temperature: 0,
            thinkingConfig: { thinkingLevel: "low" },
            maxOutputTokens: 32768,
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errText);
      const status = geminiRes.status === 429 ? 429 : 502;
      const msg =
        status === 429
          ? "A inteligência artificial atingiu o limite de consultas. Aguarde cerca de 1 minuto e tente novamente."
          : "Falha ao consultar a IA. Tente novamente em instantes.";
      return new Response(JSON.stringify({ error: msg }), {
        status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const geminiJson = await geminiRes.json();
    const candidate = geminiJson?.candidates?.[0];
    const rawText = candidate?.content?.parts?.[0]?.text;
    const finishReason = candidate?.finishReason;

    if (!rawText) {
      console.error("Resposta do Gemini sem texto. finishReason:", finishReason, JSON.stringify(geminiJson));
      const hint =
        finishReason === "MAX_TOKENS"
          ? " (resposta cortada por limite de tokens — aumente maxOutputTokens na function)"
          : "";
      return new Response(JSON.stringify({ error: `IA não retornou conteúdo válido${hint}.` }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    let parsed: any = {};
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    const monthPeriods: string[] = Array.isArray(parsed.monthPeriods) ? parsed.monthPeriods : [];
    const aiWeekPeriods: string[] = Array.isArray(parsed.weekPeriods) ? parsed.weekPeriods : [];
    const rawMetrics: any[] = Array.isArray(parsed.metrics) ? parsed.metrics : [];

    const zipPoints = (periods: string[], values: any[]) =>
      periods.map((period, i) => ({
        period,
        value: typeof values?.[i] === "number" ? values[i] : null,
      }));

    // Mês no futuro (posterior ao mês corrente) não pode ter dado real ainda — a IA
    // às vezes preenche um número onde deveria ser null. Descarta esses pontos.
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    const isFutureMonth = (period: string) => {
      const [y, m] = (period || "").split(".").map(Number);
      if (!y || !m || m > 12) return false;
      return y > curYear || (y === curYear && m > curMonth);
    };

    // Prioriza os períodos de semana detectados geometricamente (ground-truth do
    // PDF) sobre o eco da IA, que pode divergir.
    const effectiveWeekPeriods = detectedWeekPeriods.length > 0 ? detectedWeekPeriods : aiWeekPeriods;

    // Só sufixa a chave quando há colisão, pra manter a chave estável entre uploads.
    const keyOccurrences = new Map<string, number>();
    const metrics = rawMetrics
      .filter((m) => m && m.name)
      .map((m) => {
        const baseKey = `${slugify(m.section || "geral")}__${slugify(m.name)}`;
        const count = (keyOccurrences.get(baseKey) || 0) + 1;
        keyOccurrences.set(baseKey, count);

        // Sobrescreve a semana com o valor resolvido por posição na página, quando
        // encontramos uma linha correspondente — a IA erra o corte mês/semana com
        // frequência nessa tabela densa.
        const deterministicWeekly = weeklyByLabel[normalizeLabel(m.name)];
        const weeklyValues =
          deterministicWeekly && deterministicWeekly.length === effectiveWeekPeriods.length
            ? deterministicWeekly
            : m.weekly || [];

        return {
          key: count === 1 ? baseKey : `${baseKey}__${count}`,
          section: m.section || "Geral",
          name: m.name,
          unit: ["percent", "currency", "number"].includes(m.unit) ? m.unit : "number",
          meta: typeof m.meta === "number" ? m.meta : null,
          direction: m.direction === "up" || m.direction === "down" ? m.direction : null,
          monthly: zipPoints(monthPeriods, m.monthly || []).filter((pt) => !isFutureMonth(pt.period)),
          weekly: zipPoints(effectiveWeekPeriods, weeklyValues),
        };
      });

    if (metrics.length === 0) {
      return new Response(JSON.stringify({ error: "Não foi possível extrair indicadores deste PDF." }), {
        status: 422,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        partnerName: parsed.partnerName || "",
        location: parsed.location || "",
        metrics,
        model: GEMINI_MODEL,
        generatedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Erro inesperado na function:", err);
    return new Response(JSON.stringify({ error: "Erro interno ao processar o relatório em PDF." }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
