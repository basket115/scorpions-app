import type { Context } from "https://edge.netlify.com";
import { fetchSupabaseBranding } from "./lib/supabaseBranding.ts";
import { fetchSupabaseBeitraege } from "./lib/supabaseBeitraege.ts";
import { fetchSupabaseSponsoren } from "./lib/supabaseSponsoren.ts";
import { fetchSupabaseHasTeamLogin, fetchSupabaseTeamRole } from "./lib/supabaseTeamZugaenge.ts";
import { pruefeZugang, createBeitrag } from "./lib/supabaseBeitraegeSchreiben.ts";
import { filterBranding } from "./lib/brandingFilter.ts";

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
    if (action === "beitragErstellen") {
      // Schreibaktion laeuft NUR gegen Supabase - dieser Zweig greift vor
      // dem Start von gasFetchPromise, damit nichts an GAS geht. Kein
      // GAS-Rueckfall bei Fehlern.
      if (request.method !== "POST") {
        return new Response(
          JSON.stringify({ success: false, error: "Nur POST erlaubt" }),
          { status: 405, headers: RESPONSE_HEADERS }
        );
      }

      let body: any = null;
      try {
        body = await request.json();
      } catch {
        body = null;
      }

      const kundenId = String(body?.kundenId ?? "").trim();
      const teamId = String(body?.teamId ?? "").trim();
      const passwort = String(body?.passwort ?? "");
      const titel = String(body?.titel ?? "").trim();
      const text = String(body?.text ?? "").trim();

      if (!titel || !text) {
        return new Response(
          JSON.stringify({ success: false, error: "Titel und Text sind Pflicht" }),
          { status: 200, headers: RESPONSE_HEADERS }
        );
      }

      const zugang = await pruefeZugang(kundenId, teamId, passwort);
      if (!zugang) {
        return new Response(
          JSON.stringify({ success: false, error: "Zugang verweigert" }),
          { status: 200, headers: RESPONSE_HEADERS }
        );
      }

      if (zugang.rolle !== "admin") {
        return new Response(
          JSON.stringify({ success: false, error: "Keine Berechtigung" }),
          { status: 200, headers: RESPONSE_HEADERS }
        );
      }

      // kunden_id kommt aus der gefundenen team_zugaenge-Zeile, nicht vom Browser.
      const beitrag = await createBeitrag({
        kunden_id: zugang.kunden_id,
        titel,
        text,
        bild_url: String(body?.bildUrl ?? "").trim(),
        video_url: String(body?.videoUrl ?? "").trim(),
        kategorie: String(body?.kategorie ?? "").trim() || "News",
      });

      if (!beitrag) {
        return new Response(
          JSON.stringify({ success: false, error: "Speichern fehlgeschlagen" }),
          { status: 200, headers: RESPONSE_HEADERS }
        );
      }

      return new Response(
        JSON.stringify({ success: true, beitrag }),
        { status: 200, headers: RESPONSE_HEADERS }
      );
    }

    // WICHTIG: cache: "no-store" verhindert, dass Netlify/Deno diese
    // Anfrage an Google selbst zwischenspeichert (Ursache fuer veraltete
    // Beitragslisten nach einer Freigabe im Studio).
    const gasFetchPromise = fetch(targetUrl, {
      method: request.method,
      headers: { "User-Agent": "Netlify-Edge-Proxy/1.0" },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });

    if (action === "get_bootstrap") {
      const kundenId = url.searchParams.get("kundenId") || "";
      // GAS-Antwort (beitraege/sponsors) und Supabase-Branding parallel
      // holen, damit sich die Ladezeit gegenueber vorher nicht verlangsamt.
      // allSettled statt all: ein haengendes/fehlerhaftes GAS darf das
      // bereits vorliegende Supabase-Branding nicht mit sich reissen.
      const [gasResult, supabaseResult, supabaseBeitraegeResult] = await Promise.allSettled([
        gasFetchPromise,
        fetchSupabaseBranding(kundenId),
        fetchSupabaseBeitraege(kundenId),
      ]);

      const supabaseBranding = supabaseResult.status === "fulfilled" ? supabaseResult.value : null;
      const supabaseBeitraege = supabaseBeitraegeResult.status === "fulfilled" ? supabaseBeitraegeResult.value : null;

      let data: any = null;
      if (gasResult.status === "fulfilled") {
        try {
          data = await gasResult.value.json();
        } catch (parseError) {
          console.error("[Proxy] GAS-Antwort nicht als JSON lesbar", parseError);
          data = null;
        }
      } else {
        console.error("[Proxy] GAS-Fetch fehlgeschlagen", gasResult.reason);
      }

      if (data) {
        if (supabaseBranding && data.branding) {
          // Nur die aus Supabase uebersetzten Felder ueberschreiben - alle
          // anderen Branding-Felder (Passwort, Social-URLs, Demo_Ende, ...)
          // bleiben unveraendert aus GAS.
          Object.assign(data.branding, supabaseBranding);
        }
        if (data.branding) {
          // Nur erlaubte Felder an den Browser - "Passwort" u. a. fallen weg.
          data.branding = filterBranding(data.branding);
        }
        if (supabaseBeitraege) {
          // Beitraege kommen jetzt aus Supabase statt aus GAS. Schlaegt
          // Supabase fehl, bleiben die GAS-Beitraege unveraendert stehen.
          data.beitraege = supabaseBeitraege;
        }
        return new Response(JSON.stringify(data), { status: 200, headers: RESPONSE_HEADERS });
      }

      if (supabaseBranding) {
        // GAS nicht verfuegbar, aber Supabase-Branding da: App bekommt
        // wenigstens das Branding statt komplett zu scheitern.
        const fallback = {
          success: true,
          branding: filterBranding(supabaseBranding),
          beitraege: supabaseBeitraege ?? [],
          sponsoren: [],
          gasUnavailable: true,
        };
        return new Response(JSON.stringify(fallback), { status: 200, headers: RESPONSE_HEADERS });
      }

      return new Response(
        JSON.stringify({ success: false, error: "Proxy Fehler" }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }}
      );
    }

    if (action === "get_branding") {
      // GAS-Antwort nie ungefiltert durchreichen: das Branding wird auf
      // die erlaubten Felder reduziert. Nicht lesbares JSON wird nicht
      // weitergegeben, weil es geheime Felder enthalten koennte.
      const response = await gasFetchPromise;
      let data: any = null;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("[Proxy] GAS-Antwort nicht als JSON lesbar (get_branding)", parseError);
        data = null;
      }

      if (!data) {
        return new Response(
          JSON.stringify({ success: false, error: "Proxy Fehler" }),
          { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }}
        );
      }

      if (data.branding) {
        data.branding = filterBranding(data.branding);
      }
      return new Response(JSON.stringify(data), { status: 200, headers: RESPONSE_HEADERS });
    }

    if (action === "get_beitraege") {
      const kundenId = url.searchParams.get("kundenId") || "";
      const [gasResult, supabaseBeitraegeResult] = await Promise.allSettled([
        gasFetchPromise,
        fetchSupabaseBeitraege(kundenId),
      ]);

      const supabaseBeitraege =
        supabaseBeitraegeResult.status === "fulfilled" ? supabaseBeitraegeResult.value : null;

      if (supabaseBeitraege) {
        // Beitraege kommen jetzt aus Supabase statt aus GAS. rows und
        // beitraege, weil Tab1/feed.ts beide Schluessel lesen.
        return new Response(
          JSON.stringify({ success: true, rows: supabaseBeitraege, beitraege: supabaseBeitraege }),
          { status: 200, headers: RESPONSE_HEADERS }
        );
      }

      // Supabase-Fehlerfall: unveraendert auf GAS zurueckfallen.
      if (gasResult.status === "fulfilled") {
        const data = await gasResult.value.text();
        return new Response(data, { status: 200, headers: RESPONSE_HEADERS });
      }

      return new Response(
        JSON.stringify({ success: false, error: "Proxy Fehler" }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }}
      );
    }

    if (action === "get_sponsors") {
      const kundenId = url.searchParams.get("kundenId") || "";
      const [gasResult, supabaseSponsorenResult] = await Promise.allSettled([
        gasFetchPromise,
        fetchSupabaseSponsoren(kundenId),
      ]);

      const supabaseSponsoren =
        supabaseSponsorenResult.status === "fulfilled" ? supabaseSponsorenResult.value : null;

      if (supabaseSponsoren) {
        // Sponsoren kommen jetzt aus Supabase statt aus GAS.
        return new Response(
          JSON.stringify({ success: true, sponsors: supabaseSponsoren }),
          { status: 200, headers: RESPONSE_HEADERS }
        );
      }

      // Supabase-Fehlerfall: unveraendert auf GAS zurueckfallen.
      if (gasResult.status === "fulfilled") {
        const data = await gasResult.value.text();
        return new Response(data, { status: 200, headers: RESPONSE_HEADERS });
      }

      return new Response(
        JSON.stringify({ success: false, error: "Proxy Fehler" }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }}
      );
    }

    if (action === "checkTeamLogin") {
      const kundenId = url.searchParams.get("kundenId") || "";
      const [gasResult, hasTeamLoginResult] = await Promise.allSettled([
        gasFetchPromise,
        fetchSupabaseHasTeamLogin(kundenId),
      ]);

      const hasTeamLogin =
        hasTeamLoginResult.status === "fulfilled" ? hasTeamLoginResult.value : null;

      if (hasTeamLogin !== null) {
        return new Response(
          JSON.stringify({ hasTeamLogin }),
          { status: 200, headers: RESPONSE_HEADERS }
        );
      }

      // Supabase-Fehlerfall: unveraendert auf GAS zurueckfallen.
      if (gasResult.status === "fulfilled") {
        const data = await gasResult.value.text();
        return new Response(data, { status: 200, headers: RESPONSE_HEADERS });
      }

      return new Response(
        JSON.stringify({ success: false, error: "Proxy Fehler" }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }}
      );
    }

    if (action === "getTeamRole") {
      const kundenId = url.searchParams.get("kundenId") || "";
      const password = url.searchParams.get("password") || "";
      const [gasResult, teamRoleResult] = await Promise.allSettled([
        gasFetchPromise,
        fetchSupabaseTeamRole(kundenId, password),
      ]);

      const teamRole = teamRoleResult.status === "fulfilled" ? teamRoleResult.value : null;

      if (teamRole !== null) {
        // Sowohl Treffer als auch "falsches Passwort" sind definitive
        // Antworten aus Supabase - kein GAS-Fallback in beiden Faellen.
        return new Response(
          JSON.stringify(teamRole),
          { status: 200, headers: RESPONSE_HEADERS }
        );
      }

      // Supabase-Fehlerfall: unveraendert auf GAS zurueckfallen.
      if (gasResult.status === "fulfilled") {
        const data = await gasResult.value.text();
        return new Response(data, { status: 200, headers: RESPONSE_HEADERS });
      }

      return new Response(
        JSON.stringify({ success: false, error: "Proxy Fehler" }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }}
      );
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
