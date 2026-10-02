// Supabase Edge Function (Deno) — proxy da API de rotas/OS do SmartOS.
//
// Por que um proxy: a API exige a chave em x-api-key e a doc pede chamada
// server-side. Este app é um front CRA — qualquer chave em REACT_APP_* vai
// pro bundle do navegador e fica visível pra qualquer um. Aqui a chave fica
// só como secret da function.
//
// Secrets necessários (supabase secrets set ...):
//   SERVICE_ORDERS_API_URL  ex: https://<site>.vercel.app/api/service-orders
//   SERVICE_ORDERS_API_KEY  a chave da API

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const API_URL = Deno.env.get("SERVICE_ORDERS_API_URL");
const API_KEY = Deno.env.get("SERVICE_ORDERS_API_KEY");

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }
  if (!API_URL || !API_KEY) {
    return json(
      { error: "SERVICE_ORDERS_API_URL / SERVICE_ORDERS_API_KEY não configurados nos secrets da function." },
      500,
    );
  }

  // Filtro opcional por unidade (a API aceita ?asc=<nome ou id>). Sem filtro,
  // devolve as rotas de todas as unidades.
  let asc: string | undefined;
  try {
    const body = await req.json();
    if (typeof body?.asc === "string" && body.asc.trim()) asc = body.asc.trim();
  } catch {
    // sem body: sem filtro
  }

  const url = new URL(API_URL);
  if (asc) url.searchParams.set("asc", asc);

  let upstream: Response;
  try {
    upstream = await fetch(url, { headers: { "x-api-key": API_KEY } });
  } catch (err) {
    console.error("service-orders: falha de rede", err);
    return json({ error: "Falha ao contatar a API de rotas." }, 502);
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    console.error("service-orders: API respondeu", upstream.status, detail);
    const messages: Record<number, string> = {
      401: "Chave da API de rotas ausente ou inválida.",
      404: "Unidade inexistente na API de rotas.",
      500: "A API de rotas não está configurada (chave não definida no servidor dela).",
    };
    return json({ error: messages[upstream.status] ?? `API de rotas respondeu ${upstream.status}.` }, 502);
  }

  const data = await upstream.json();
  return json(data);
});
