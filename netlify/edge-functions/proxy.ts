import type { Context } from "https://edge.netlify.com";
import { fetchSupabaseBranding, istSupabaseKunde } from "./lib/supabaseBranding.ts";
import { fetchSupabaseBeitraege } from "./lib/supabaseBeitraege.ts";
import { fetchSupabaseSponsoren } from "./lib/supabaseSponsoren.ts";
import { fetchSupabaseHasTeamLogin, fetchSupabaseTeamRole } from "./lib/supabaseTeamZugaenge.ts";
import { pruefeZugang, createBeitrag, updateBeitrag, deleteBeitrag } from "./lib/supabaseBeitraegeSchreiben.ts";
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

// Aktionen, die der Proxy an GAS weiterreichen darf. Enthaelt alle
// Aktionen, die das Frontend (src/) ueber /api/proxy aufruft und die ganz
// oder als Rueckfall an GAS gehen. Alles andere wird abgelehnt.
const GAS_ERLAUBTE_AKTIONEN = new Set([
  "get_bootstrap",
  "get_branding",
  "get_beitraege",
  "get_sponsors",
  "checkTeamLogin",
  "getTeamRole",
  "update_sponsor",
]);

// Team-Zugaenge und Passwoerter werden nie ueber den Proxy verwaltet -
// GAS wuerde hier u. a. Passwoerter im Klartext zurueckgeben.
const GESPERRTE_AKTIONEN = new Set([
  "get_team_zugaenge",
  "add_team_zugang",
  "remove_team_zugang",
  "update_passwort",
]);

function nichtErlaubt(): Response {
  return new Response(
    JSON.stringify({ success: false, error: "Aktion nicht erlaubt" }),
    { status: 403, headers: RESPONSE_HEADERS }
  );
}

function jsonAntwort(daten: unknown): Response {
  return new Response(JSON.stringify(daten), { status: 200, headers: RESPONSE_HEADERS });
}

function proxyFehler(): Response {
  return new Response(
    JSON.stringify({ success: false, error: "Proxy Fehler" }),
    { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }}
  );
}

// WICHTIG: cache: "no-store" verhindert, dass Netlify/Deno diese
// Anfrage an Google selbst zwischenspeichert (Ursache fuer veraltete
// Beitragslisten nach einer Freigabe im Studio).
function gasAbfragen(targetUrl: string, method: string): Promise<Response> {
  return fetch(targetUrl, {
    method,
    headers: { "User-Agent": "Netlify-Edge-Proxy/1.0" },
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });
}

// Reicht die GAS-Antwort unveraendert als Text durch.
async function gasDurchreichen(targetUrl: string, method: string): Promise<Response> {
  const response = await gasAbfragen(targetUrl, method);
  const data = await response.text();
  return new Response(data, { status: 200, headers: RESPONSE_HEADERS });
}

// get_bootstrap ueber GAS. Optional vorhandene Supabase-Teile (Branding,
// Beitraege) werden wie bisher in die GAS-Antwort uebernommen; faellt GAS
// aus, bekommt die App wenigstens das Supabase-Branding.
async function bootstrapUeberGas(
  targetUrl: string,
  method: string,
  supabaseBranding: Record<string, unknown> | null,
  supabaseBeitraege: Record<string, unknown>[] | null
): Promise<Response> {
  let data: any = null;
  try {
    const response = await gasAbfragen(targetUrl, method);
    try {
      data = await response.json();
    } catch (parseError) {
      console.error("[Proxy] GAS-Antwort nicht als JSON lesbar", parseError);
      data = null;
    }
  } catch (gasError) {
    console.error("[Proxy] GAS-Fetch fehlgeschlagen", gasError);
  }

  if (data) {
    if (supabaseBranding && data.branding) {
      // Nur die aus Supabase uebersetzten Felder ueberschreiben - alle
      // anderen Branding-Felder bleiben unveraendert aus GAS.
      Object.assign(data.branding, supabaseBranding);
    }
    if (data.branding) {
      // Nur erlaubte Felder an den Browser - "Passwort" u. a. fallen weg.
      data.branding = filterBranding(data.branding);
    }
    if (supabaseBeitraege) {
      data.beitraege = supabaseBeitraege;
    }
    return jsonAntwort(data);
  }

  if (supabaseBranding) {
    // GAS nicht verfuegbar, aber Supabase-Branding da: App bekommt
    // wenigstens das Branding statt komplett zu scheitern.
    return jsonAntwort({
      success: true,
      branding: filterBranding(supabaseBranding),
      beitraege: supabaseBeitraege ?? [],
      sponsoren: [],
      gasUnavailable: true,
    });
  }

  return proxyFehler();
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const params = url.searchParams.toString();
  const targetUrl = `${SCRIPT_URL}${params ? '?' + params : ''}`;
  const action = url.searchParams.get("action");

  try {
    if (!action || GESPERRTE_AKTIONEN.has(action)) {
      return nichtErlaubt();
    }

    if (action === "beitragErstellen") {
      // Schreibaktion laeuft NUR gegen Supabase - dieser Zweig greift vor
      // jeder GAS-Anfrage, damit nichts an GAS geht. Kein
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

    if (action === "beitragBearbeiten") {
      // Schreibaktion laeuft NUR gegen Supabase - dieser Zweig greift vor
      // jeder GAS-Anfrage, damit nichts an GAS geht. Kein
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
      const id = String(body?.id ?? "").trim();
      const titel = String(body?.titel ?? "").trim();
      const text = String(body?.text ?? "").trim();

      if (!id) {
        return new Response(
          JSON.stringify({ success: false, error: "Keine ID" }),
          { status: 200, headers: RESPONSE_HEADERS }
        );
      }

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
      const beitrag = await updateBeitrag(id, zugang.kunden_id, {
        titel,
        text,
        bild_url: String(body?.bildUrl ?? "").trim(),
        video_url: String(body?.videoUrl ?? "").trim(),
        kategorie: String(body?.kategorie ?? "").trim(),
      });

      if (beitrag === "nicht_gefunden") {
        return new Response(
          JSON.stringify({ success: false, error: "Beitrag nicht gefunden" }),
          { status: 200, headers: RESPONSE_HEADERS }
        );
      }

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

    if (action === "beitragLoeschen") {
      // Schreibaktion laeuft NUR gegen Supabase - dieser Zweig greift vor
      // jeder GAS-Anfrage, damit nichts an GAS geht. Kein
      // GAS-Rueckfall bei Fehlern. Geloescht wird nur als Markierung.
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
      const id = String(body?.id ?? "").trim();

      if (!id) {
        return new Response(
          JSON.stringify({ success: false, error: "Keine ID" }),
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
      const beitrag = await deleteBeitrag(id, zugang.kunden_id);

      if (beitrag === "nicht_gefunden") {
        return new Response(
          JSON.stringify({ success: false, error: "Beitrag nicht gefunden" }),
          { status: 200, headers: RESPONSE_HEADERS }
        );
      }

      if (!beitrag) {
        return new Response(
          JSON.stringify({ success: false, error: "Löschen fehlgeschlagen" }),
          { status: 200, headers: RESPONSE_HEADERS }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: RESPONSE_HEADERS }
      );
    }

    // Leseaktionen: Fuer Kunden, die in Supabase gefuehrt werden
    // (istSupabaseKunde === true), antwortet der Proxy nur aus Supabase und
    // wartet nicht auf GAS. Alle anderen Kunden laufen wie bisher ueber GAS.
    // GAS wird nur noch dort angefragt, wo es gebraucht wird - nie parallel
    // "auf Vorrat".

    if (action === "get_bootstrap") {
      const kundenId = url.searchParams.get("kundenId") || "";
      const [imSupabase, supabaseBranding, supabaseBeitraege, supabaseSponsoren] = await Promise.all([
        istSupabaseKunde(kundenId),
        fetchSupabaseBranding(kundenId),
        fetchSupabaseBeitraege(kundenId),
        fetchSupabaseSponsoren(kundenId),
      ]);

      if (imSupabase === true && supabaseBranding && supabaseBeitraege && supabaseSponsoren) {
        // settings, teams, studioSponsor und meta liest die App nicht -
        // deshalb kein Warten auf GAS.
        return jsonAntwort({
          success: true,
          kundenId,
          branding: filterBranding(supabaseBranding),
          beitraege: supabaseBeitraege,
          sponsors: supabaseSponsoren,
        });
      }

      if (imSupabase === false) {
        // Kein Supabase-Kunde: unveraendert ueber GAS.
        return await bootstrapUeberGas(targetUrl, request.method, null, null);
      }

      // Technischer Fehler bei Supabase: bisheriger Weg (GAS + die
      // Supabase-Teile, die geantwortet haben). Beitraege nur uebernehmen,
      // wenn es welche gibt - eine leere Liste darf die GAS-Beitraege
      // nicht verdraengen, solange unklar ist, ob der Kunde in Supabase ist.
      const beitraegeFuerMerge =
        imSupabase === true || (supabaseBeitraege && supabaseBeitraege.length) ? supabaseBeitraege : null;
      return await bootstrapUeberGas(targetUrl, request.method, supabaseBranding, beitraegeFuerMerge);
    }

    if (action === "get_branding") {
      // GAS-Antwort nie ungefiltert durchreichen: das Branding wird auf
      // die erlaubten Felder reduziert. Nicht lesbares JSON wird nicht
      // weitergegeben, weil es geheime Felder enthalten koennte.
      const response = await gasAbfragen(targetUrl, request.method);
      let data: any = null;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("[Proxy] GAS-Antwort nicht als JSON lesbar (get_branding)", parseError);
        data = null;
      }

      if (!data) return proxyFehler();

      if (data.branding) {
        data.branding = filterBranding(data.branding);
      }
      return jsonAntwort(data);
    }

    if (action === "get_beitraege") {
      const kundenId = url.searchParams.get("kundenId") || "";
      const [imSupabase, supabaseBeitraege] = await Promise.all([
        istSupabaseKunde(kundenId),
        fetchSupabaseBeitraege(kundenId),
      ]);

      if (imSupabase === true && supabaseBeitraege) {
        // rows und beitraege, weil Tab1/feed.ts beide Schluessel lesen.
        return jsonAntwort({ success: true, rows: supabaseBeitraege, beitraege: supabaseBeitraege });
      }

      // Kein Supabase-Kunde oder technischer Fehler: GAS wie bisher.
      return await gasDurchreichen(targetUrl, request.method);
    }

    if (action === "get_sponsors") {
      const kundenId = url.searchParams.get("kundenId") || "";
      const [imSupabase, supabaseSponsoren] = await Promise.all([
        istSupabaseKunde(kundenId),
        fetchSupabaseSponsoren(kundenId),
      ]);

      if (imSupabase === true && supabaseSponsoren) {
        return jsonAntwort({ success: true, sponsors: supabaseSponsoren });
      }

      // Kein Supabase-Kunde oder technischer Fehler: GAS wie bisher.
      return await gasDurchreichen(targetUrl, request.method);
    }

    if (action === "checkTeamLogin") {
      const kundenId = url.searchParams.get("kundenId") || "";
      const [imSupabase, hasTeamLogin] = await Promise.all([
        istSupabaseKunde(kundenId),
        fetchSupabaseHasTeamLogin(kundenId),
      ]);

      if (imSupabase === true && hasTeamLogin !== null) {
        if (hasTeamLogin === false) {
          // Kein Fehler, aber auffaellig: fehlender Schluessel/Policy liefert
          // ebenfalls eine leere Liste statt eines Fehlerstatus.
          console.warn("[Proxy] Supabase-Kunde ohne Team-Zugaenge (checkTeamLogin)", kundenId);
        }
        return jsonAntwort({ hasTeamLogin });
      }

      // Kein Supabase-Kunde oder technischer Fehler: GAS wie bisher.
      return await gasDurchreichen(targetUrl, request.method);
    }

    if (action === "getTeamRole") {
      const kundenId = url.searchParams.get("kundenId") || "";
      const password = url.searchParams.get("password") || "";
      const [imSupabase, teamRole] = await Promise.all([
        istSupabaseKunde(kundenId),
        fetchSupabaseTeamRole(kundenId, password),
      ]);

      if (imSupabase === true && teamRole !== null) {
        // Sowohl Treffer als auch "falsches Passwort" sind definitive
        // Antworten aus Supabase - kein GAS-Rueckfall in beiden Faellen.
        return jsonAntwort(teamRole);
      }

      // Kein Supabase-Kunde oder technischer Fehler: GAS wie bisher.
      return await gasDurchreichen(targetUrl, request.method);
    }

    if (!GAS_ERLAUBTE_AKTIONEN.has(action)) {
      return nichtErlaubt();
    }

    return await gasDurchreichen(targetUrl, request.method);
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Proxy Fehler" }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }}
    );
  }
};

export const config = { path: "/api/proxy" };
