import type { Context } from "https://edge.netlify.com";

// Phase 2 / Test 2 – ISOLIERTE Test-Function.
// Ersetzt NICHT /api/proxy, wird von der bestehenden scorpions-app nicht aufgerufen.
// Unterstuetzt ausschliesslich action=get_branding gegen Supabase (Tabelle public.kunden).
//
// Benoetigte Netlify-Umgebungsvariablen (serverseitig, im Netlify-Dashboard zu setzen):
//   SUPABASE_URL               - z.B. https://ccwlglszhwvbhzhdtxtl.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  - Secret/Service-Key, NIEMALS im Code oder Frontend

export default async (request: Request, _context: Context) => {
  const url = new URL(request.url);
  const action = (url.searchParams.get("action") || "").trim();
  const kundenId = (url.searchParams.get("kundenId") || "").trim();

  if (action !== "get_branding") {
    return jsonResponse({ success: false, error: "Nur action=get_branding wird von dieser Test-Function unterstuetzt" }, 400);
  }

  if (!kundenId) {
    return jsonResponse({ success: false, error: "kundenId fehlt" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ success: false, error: "Serverseitiger Supabase-Key fehlt" }, 500);
  }

  try {
    const query = `${supabaseUrl}/rest/v1/kunden?kunden_id=eq.${encodeURIComponent(kundenId)}&select=*`;
    const res = await fetch(query, {
      method: "GET",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      return jsonResponse({ success: false, error: `Supabase HTTP ${res.status}: ${errText}` }, 502);
    }

    const rows = await res.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return jsonResponse({ success: false, error: "Kunden_ID nicht gefunden" }, 404);
    }

    return jsonResponse({ success: true, branding: rows[0] }, 200);
  } catch (err) {
    return jsonResponse({ success: false, error: "Supabase-Zugriff fehlgeschlagen" }, 500);
  }
};

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export const config = { path: "/api/supabase-test-branding" };
