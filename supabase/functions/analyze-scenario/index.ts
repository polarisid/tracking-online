// Supabase Edge Function (Deno) — gera um checklist de ações a partir do
// cenário de "casos críticos" já calculado no frontend (IntelligencePanel.jsx).

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// gemini-2.0-flash foi desativado pelo Google em 01/06/2026. Se este modelo também
// for descontinuado no futuro, veja https://ai.google.dev/gemini-api/docs/deprecations
const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const CHECKLIST_SCHEMA = {
  type: "OBJECT",
  properties: {
    checklist: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING", description: "Ação curta e imperativa, ex: 'Cobrar técnico sobre OS 12345 — reparo não iniciado'" },
          description: { type: "STRING", description: "Contexto/justificativa em 1-2 frases" },
          priority: { type: "STRING", enum: ["alta", "media", "baixa"] },
          category: {
            type: "STRING",
            enum: ["sem_reparo_iniciado", "status_incorreto_rota", "sem_evolucao_sistema", "desatualizado"],
          },
          relatedOrderId: { type: "STRING", description: "OS relacionada, se houver (string vazia se não aplicável)" },
        },
        required: ["title", "description", "priority", "category", "relatedOrderId"],
        propertyOrdering: ["title", "description", "priority", "category", "relatedOrderId"],
      },
    },
  },
  required: ["checklist"],
};

interface CriticalCase {
  orderId: string;
  clientName: string;
  city: string;
  neighborhood: string;
  product: string;
  agingDays: number;
  statusLabel: string;
  reasonLabel: string;
  ascLastAppointmentDate: string;
  isToday: boolean;
  categories: string[];
  // Vindos da API de rotas do técnico em campo (SmartOS) — nem toda OS tem esses dados.
  routeObservation?: string;
  routePendingReason?: string;
  routeTechnicianName?: string;
}

interface RequestBody {
  criticalCases: CriticalCase[];
  totals?: { totalCritical: number; byCategory: Record<string, number> };
}

function buildPrompt(body: RequestBody): string {
  const { criticalCases, totals } = body;

  return `Você é um assistente operacional de logística de assistência técnica.
Analise os casos críticos abaixo (já filtrados e priorizados pela Lei de Pareto — top 20% por dias pendentes) e gere um checklist objetivo e acionável de próximos passos para a equipe de despacho.

Categorias de origem de cada caso:
- "sem_reparo_iniciado": OS em rota, agendada para hoje, mas o status ainda não é "Repair in progress" — técnico pode não ter começado o atendimento.
- "status_incorreto_rota": OS em rota, não agendada para hoje, mas o status não é "Appointment Date is set" — inconsistência de status.
- "sem_evolucao_sistema": técnico já classificou a OS como pendente/finalizada em campo, mas o sistema central ainda não reflete "Repair Completed".
- "desatualizado": ordem com agendamento no passado que ainda não foi concluída.

Regras:
- Cada item deve ser uma ação concreta e executável hoje (ex: "Cobrar técnico sobre OS X — reparo não iniciado apesar de agendado para hoje", "Verificar sincronismo do app de campo para OS Y — finalizada em campo mas sistema não evoluiu").
- Alguns casos trazem "routeObservation" (nota livre do próprio técnico em campo, via app de rotas) e/ou "routePendingReason" (motivo estruturado, ex: "Repetido"). Quando existirem, USE esse texto para tornar a ação bem específica em vez de genérica — ex: se routeObservation diz "Solicitar EPROM - Só veio a placa para realizar o reparo", a ação deve mencionar isso diretamente ("Providenciar EPROM da OS X — técnico confirmou que só a placa chegou"), não apenas "verificar pendência".
- Priorize itens com maior aging e casos "sem_reparo_iniciado"/"sem_evolucao_sistema" agendados para hoje.
- Use "alta" para casos de hoje ou com aging elevado, "media" para os demais casos críticos, "baixa" para acompanhamento de rotina.
- Agrupe itens semelhantes (mesma cidade/categoria) quando fizer sentido, em vez de repetir uma linha por OS — exceto quando routeObservation for específica o suficiente para justificar um item próprio.
- Gere no máximo 12 itens.
- Responda apenas com dados derivados do JSON fornecido; não invente OS, observações ou motivos que não estejam na lista.

Totais do cenário:
- Total de casos críticos identificados: ${totals?.totalCritical ?? criticalCases.length}
- Por categoria: ${JSON.stringify(totals?.byCategory ?? {})}

Casos críticos enviados (top ${criticalCases.length}, ordenados por dias pendentes):
${JSON.stringify(criticalCases, null, 0)}
`;
}

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

  if (!body || !Array.isArray(body.criticalCases)) {
    return new Response(JSON.stringify({ error: "Payload deve conter criticalCases (array)." }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const prompt = buildPrompt({
    criticalCases: body.criticalCases,
    totals: body.totals,
  });

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: CHECKLIST_SCHEMA,
            temperature: 0.3,
            // Modelos Gemini 3.x usam "thinking" por padrão, e os tokens de raciocínio
            // consomem o mesmo orçamento de maxOutputTokens — "low" minimiza isso
            // (não é possível desligar totalmente no Gemini 3). maxOutputTokens alto
            // dá espaço para o raciocínio + o JSON de saída sem truncar a resposta.
            thinkingConfig: { thinkingLevel: "low" },
            maxOutputTokens: 8192,
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errText);
      return new Response(JSON.stringify({ error: "Falha ao consultar a IA. Tente novamente em instantes." }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const geminiJson = await geminiRes.json();
    const candidate = geminiJson?.candidates?.[0];
    const rawText = candidate?.content?.parts?.[0]?.text;
    const finishReason = candidate?.finishReason;

    if (!rawText) {
      console.error("Resposta do Gemini sem texto. finishReason:", finishReason, JSON.stringify(geminiJson));
      const hint = finishReason === "MAX_TOKENS"
        ? " (resposta cortada por limite de tokens — aumente maxOutputTokens na function)"
        : "";
      return new Response(JSON.stringify({ error: `IA não retornou conteúdo válido${hint}.` }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    let parsed: { checklist: unknown[] };
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.error("Falha ao parsear JSON do Gemini. finishReason:", finishReason, "texto:", rawText);
      const snippet = rawText.slice(0, 300);
      return new Response(
        JSON.stringify({ error: `IA retornou formato inesperado. Trecho recebido: ${snippet}` }),
        { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        checklist: parsed.checklist ?? [],
        model: GEMINI_MODEL,
        generatedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Erro inesperado na function:", err);
    return new Response(JSON.stringify({ error: "Erro interno ao gerar checklist." }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
