import type { Context } from "https://edge.netlify.com";
import { fetchSupabaseBranding } from "./lib/supabaseBranding.ts";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzrvPIQsGaqHP28_9G-geahMB0QMYHlbylnGLUTeJagi1Sc_rgPVErasrhc0HGGthppYA/exec"; // umgestellt auf die bereits reparierte, bewiesen aktuelle Bereitstellung

const RESPONSE_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  // WICHTIG: harte Cache-Sperre. "no-cache" allein reichte nicht -
  // Browser/Netlify-Edge konnten die Antwort trotzdem wiederverwenden.
  // Diese Kombination verbietet jede Zwischenspeicherung eindeutig.
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const params = url.searchParams.toString();
  const targetUrl = `${SCRIPT_URL}${params ? '?' + params : ''}`;
  const action = url.searchParams.get("action");

  try {
    // WICHTIG: cache: "no-store" verhindert, dass Netlify/Deno diese
    // Anfrage an Google selbst zwischenspeichert (Ursache fuer veraltete
    // Beitragslisten nach einer Freigabe im Studio).
    const gasFetchPromise = fetch(targetUrl, {
      method: request.method,
      headers: { "User-Agent": "Netlify-Edge-Proxy/1.0" },
      redirect: "follow",
      cache: "no-store",
    });

    if (action === "get_bootstrap") {
      const kundenId = url.searchParams.get("kundenId") || "";
      // GAS-Antwort (beitraege/sponsors) und Supabase-Branding parallel
      // holen, damit sich die Ladezeit gegenueber vorher nicht verlangsamt.
      const [response, supabaseBranding] = await Promise.all([
        gasFetchPromise,
        fetchSupabaseBranding(kundenId),
      ]);
      const data = await response.json();

      if (supabaseBranding && data?.branding) {
        // Nur die aus Supabase uebersetzten Felder ueberschreiben - alle
        // anderen Branding-Felder (Passwort, Social-URLs, Demo_Ende, ...)
        // bleiben unveraendert aus GAS.
        Object.assign(data.branding, supabaseBranding);
      }

      return new Response(JSON.stringify(data), { status: 200, headers: RESPONSE_HEADERS });
    }

    const response = await gasFetchPromise;
    const data = await response.text();
    return new Response(data, { status: 200, headers: RESPONSE_HEADERS });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Proxy Fehler" }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }}
    );
  }
};

export const config = { path: "/api/proxy" };
