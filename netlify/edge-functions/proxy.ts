import type { Context } from "https://edge.netlify.com";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx7gnTorNAQz21x3vwZOFQl2bkP2t1QKLppcUSQ_-CQywRS-36AZOeqDDMJg3uXVa2ntA/exec"; // umgestellt auf die bereits reparierte, bewiesen aktuelle Bereitstellung

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const params = url.searchParams.toString();
  const targetUrl = `${SCRIPT_URL}${params ? '?' + params : ''}`;

  try {
    // WICHTIG: cache: "no-store" verhindert, dass Netlify/Deno diese
    // Anfrage an Google selbst zwischenspeichert (Ursache fuer veraltete
    // Beitragslisten nach einer Freigabe im Studio).
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: { "User-Agent": "Netlify-Edge-Proxy/1.0" },
      redirect: "follow",
      cache: "no-store",
    });
    const data = await response.text();
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        // WICHTIG: harte Cache-Sperre. "no-cache" allein reichte nicht -
        // Browser/Netlify-Edge konnten die Antwort trotzdem wiederverwenden.
        // Diese Kombination verbietet jede Zwischenspeicherung eindeutig.
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Proxy Fehler" }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }}
    );
  }
};

export const config = { path: "/api/proxy" };
