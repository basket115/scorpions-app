import type { Context } from "https://edge.netlify.com";
import { fetchRechtLinks, fetchSupabaseBranding, istSupabaseKunde } from "./lib/supabaseBranding.ts";
import { beitragsKanal, fetchSupabaseBeitraege } from "./lib/supabaseBeitraege.ts";
import { fetchSupabaseSponsoren } from "./lib/supabaseSponsoren.ts";
import { fetchSupabaseHasTeamLogin, fetchSupabaseTeamRole } from "./lib/supabaseTeamZugaenge.ts";
import {
  pruefeZugang,
  createBeitrag,
  updateBeitrag,
  deleteBeitrag,
  unteradminKategorie,
  ladeVereinsKategorien,
} from "./lib/supabaseBeitraegeSchreiben.ts";
import type { Zugang } from "./lib/supabaseBeitraegeSchreiben.ts";
import { bearerToken, pruefeEmailZugang } from "./lib/emailZugang.ts";
import { filterBranding } from "./lib/brandingFilter.ts";
import {
  brandingVollstaendig,
  FEHLER_VEREINSNAME,
  leseFehler,
  type LeseFehler,
} from "./lib/supabaseAbruf.ts";
import { zaehleImHintergrund } from "./lib/nutzungZaehlen.ts";

// Alle Daten kommen nur aus Supabase. Es gibt keinen GAS-Rueckfall mehr
// (alle Kunden stehen in Supabase, Entscheidung 14.10.2026).

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

// Team-Zugaenge und Passwoerter werden nie ueber den Proxy verwaltet.
// Sponsoren werden nur im Admin-Panel gepflegt (Supabase). Jede Aktion,
// die unten nicht ausdruecklich behandelt wird, ist ohnehin abgelehnt.
const GESPERRTE_AKTIONEN = new Set([
  "get_team_zugaenge",
  "add_team_zugang",
  "remove_team_zugang",
  "update_passwort",
  "update_sponsor",
]);

// Titel und Text eines Beitrags werden als reiner Text gespeichert. Spitze
// Klammern werden beim Speichern durch aehnliche, harmlose Zeichen ersetzt
// - genauso wie im ONLANG Studio (Edge Function studio-beitrag). So kann
// ein Beitrag nie HTML enthalten, egal welche Seite ihn spaeter anzeigt.
function ohneSpitzeKlammern(wert: string): string {
  return wert.replace(/</g, "‹").replace(/>/g, "›");
}

function nichtErlaubt(): Response {
  return new Response(
    JSON.stringify({ success: false, error: "Aktion nicht erlaubt" }),
    { status: 403, headers: RESPONSE_HEADERS }
  );
}

function jsonAntwort(daten: unknown): Response {
  return new Response(JSON.stringify(daten), { status: 200, headers: RESPONSE_HEADERS });
}

// Kunde unbekannt (404) oder Supabase auch beim zweiten Versuch nicht
// erreichbar (503): klare Fehlermeldung statt leerer Daten.
function fehlerAntwort(fehler: LeseFehler, kundenId: string): Response {
  if (fehler.status === 503) console.error("[Proxy]", fehler.error, kundenId);
  return new Response(
    JSON.stringify({ success: false, error: fehler.error }),
    { status: fehler.status, headers: RESPONSE_HEADERS }
  );
}

// Branding ohne Vereinsnamen gilt nicht als Erfolg (sonst zeigte die App
// "Sport App" ohne Farbe und Logo).
function vereinsnameFehlt(kundenId: string): Response {
  console.error("[Proxy]", FEHLER_VEREINSNAME, kundenId);
  return new Response(
    JSON.stringify({ success: false, error: FEHLER_VEREINSNAME }),
    { status: 500, headers: RESPONSE_HEADERS }
  );
}

// Zugang fuer Schreib-Aktionen: mit E-Mail-Login (Authorization: Bearer)
// derselbe Supabase-Login wie Studio/Admin, sonst der alte Weg ueber
// team_zugaenge (Team-ID + App-Passwort, V002/V006/HU001).
const EMAIL_FEHLER: Record<string, string> = {
  kein_login: "Bitte neu anmelden",
  anderer_verein: "Dieses Login gehoert zu einem anderen Verein",
  kein_zugang: "Zugang verweigert",
  gesperrt: "Testphase beendet",
  fehler: "Speichern fehlgeschlagen",
};

async function zugangFuerSchreiben(
  request: Request, kundenId: string, teamId: string, passwort: string
): Promise<{ zugang: Zugang } | { antwort: Response }> {
  const token = bearerToken(request);
  if (token) {
    const e = await pruefeEmailZugang(token, kundenId);
    if (e.status === "ok") return { zugang: e.zugang };
    return { antwort: new Response(
      JSON.stringify({ success: false, error: EMAIL_FEHLER[e.status], code: e.status }),
      { status: 200, headers: RESPONSE_HEADERS }
    ) };
  }
  const zugang = await pruefeZugang(kundenId, teamId, passwort);
  if (!zugang) {
    return { antwort: new Response(
      JSON.stringify({ success: false, error: "Zugang verweigert" }),
      { status: 200, headers: RESPONSE_HEADERS }
    ) };
  }
  return { zugang };
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  try {
    if (!action || GESPERRTE_AKTIONEN.has(action)) {
      return nichtErlaubt();
    }

    if (action === "emailRolle") {
      const kundenId = (url.searchParams.get("kundenId") || "").trim();
      const e = await pruefeEmailZugang(bearerToken(request), kundenId);
      const antwort = e.status === "ok"
        ? { success: true, rolle: e.zugang.rolle }
        : { success: false, error: EMAIL_FEHLER[e.status], code: e.status };
      return new Response(JSON.stringify(antwort), { status: 200, headers: RESPONSE_HEADERS });
    }

    if (action === "beitragErstellen") {
      // Schreibaktion laeuft nur gegen Supabase.
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
      const titel = ohneSpitzeKlammern(String(body?.titel ?? "").trim());
      const text = ohneSpitzeKlammern(String(body?.text ?? "").trim());

      if (!titel || !text) {
        return new Response(
          JSON.stringify({ success: false, error: "Titel und Text sind Pflicht" }),
          { status: 200, headers: RESPONSE_HEADERS }
        );
      }

      const pruefung = await zugangFuerSchreiben(request, kundenId, teamId, passwort);
      if ("antwort" in pruefung) return pruefung.antwort;
      const zugang = pruefung.zugang;

      // Hauptadmin: Kategorie wie geschickt. Unteradmin: immer seine
      // Mannschaft aus der team_zugaenge-Zeile - die Kategorie vom Browser
      // wird ignoriert.
      let kategorie = String(body?.kategorie ?? "").trim() || "News";
      if (zugang.rolle !== "admin") {
        const eigeneKategorie = unteradminKategorie(zugang);
        if (!eigeneKategorie) {
          return new Response(
            JSON.stringify({ success: false, error: "Keine Berechtigung" }),
            { status: 200, headers: RESPONSE_HEADERS }
          );
        }

        // Sicherheitsnetz: die Mannschaft muss eine Kategorie des Vereins sein.
        const vereinsKategorien = await ladeVereinsKategorien(zugang.kunden_id);
        if (!vereinsKategorien) {
          return new Response(
            JSON.stringify({ success: false, error: "Speichern fehlgeschlagen" }),
            { status: 200, headers: RESPONSE_HEADERS }
          );
        }
        if (!vereinsKategorien.includes(eigeneKategorie)) {
          return new Response(
            JSON.stringify({ success: false, error: "Mannschaft ist keine Kategorie des Vereins" }),
            { status: 200, headers: RESPONSE_HEADERS }
          );
        }
        kategorie = eigeneKategorie;
      }

      // kunden_id kommt aus der gefundenen team_zugaenge-Zeile, nicht vom Browser.
      const beitrag = await createBeitrag({
        kunden_id: zugang.kunden_id,
        titel,
        text,
        bild_url: String(body?.bildUrl ?? "").trim(),
        video_url: String(body?.videoUrl ?? "").trim(),
        kategorie,
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
      // Schreibaktion laeuft nur gegen Supabase.
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
      const titel = ohneSpitzeKlammern(String(body?.titel ?? "").trim());
      const text = ohneSpitzeKlammern(String(body?.text ?? "").trim());

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

      const pruefung = await zugangFuerSchreiben(request, kundenId, teamId, passwort);
      if ("antwort" in pruefung) return pruefung.antwort;
      const zugang = pruefung.zugang;

      // kunden_id, rolle und mannschaft kommen aus der gefundenen
      // team_zugaenge-Zeile, nicht vom Browser. Ob der Zugang diesen Beitrag
      // aendern darf (Hauptadmin immer, Unteradmin nur in seiner Kategorie),
      // prueft updateBeitrag an der gespeicherten Kategorie.
      const beitrag = await updateBeitrag(id, zugang, {
        titel,
        text,
        bild_url: String(body?.bildUrl ?? "").trim(),
        video_url: String(body?.videoUrl ?? "").trim(),
        kategorie: String(body?.kategorie ?? "").trim(),
      });

      if (beitrag === "nicht_erlaubt") {
        return new Response(
          JSON.stringify({ success: false, error: "Keine Berechtigung" }),
          { status: 200, headers: RESPONSE_HEADERS }
        );
      }

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
      // Schreibaktion laeuft nur gegen Supabase. Geloescht wird nur als
      // Markierung.
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

      const pruefung = await zugangFuerSchreiben(request, kundenId, teamId, passwort);
      if ("antwort" in pruefung) return pruefung.antwort;
      const zugang = pruefung.zugang;

      // kunden_id, rolle und mannschaft kommen aus der gefundenen
      // team_zugaenge-Zeile, nicht vom Browser. Ob der Zugang diesen Beitrag
      // loeschen darf (Hauptadmin immer, Unteradmin nur in seiner Kategorie),
      // prueft deleteBeitrag an der gespeicherten Kategorie.
      const beitrag = await deleteBeitrag(id, zugang);

      if (beitrag === "nicht_erlaubt") {
        return new Response(
          JSON.stringify({ success: false, error: "Keine Berechtigung" }),
          { status: 200, headers: RESPONSE_HEADERS }
        );
      }

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

    // Leseaktionen: nur aus Supabase. Jede Aktion prueft zuerst, ob es den
    // Kunden in Supabase gibt (sonst 404 "Kunde nicht gefunden"). Scheitert
    // ein Abruf auch beim zweiten Versuch, kommt 503 mit Fehlermeldung.

    if (action === "get_bootstrap") {
      const kundenId = url.searchParams.get("kundenId") || "";
      // Das Beitragsfenster /embed fragt mit kanal=website, die App ohne (= app).
      const kanal = beitragsKanal(url.searchParams.get("kanal"));
      const [imSupabase, supabaseBranding, supabaseBeitraege, supabaseSponsoren, rechtLinks] = await Promise.all([
        istSupabaseKunde(kundenId),
        fetchSupabaseBranding(kundenId),
        fetchSupabaseBeitraege(kundenId, kanal),
        fetchSupabaseSponsoren(kundenId),
        fetchRechtLinks(kundenId),
      ]);

      const fehler = leseFehler(imSupabase, [supabaseBranding, supabaseBeitraege, supabaseSponsoren]);
      if (fehler) return fehlerAntwort(fehler, kundenId);

      const branding = filterBranding(supabaseBranding);
      if (!brandingVollstaendig(branding)) return vereinsnameFehlt(kundenId);

      // Ein App-Start = ein erfolgreiches get_bootstrap der App (ohne kanal;
      // das Beitragsfenster /embed fragt mit kanal=website und zaehlt nicht).
      // Nur Kunden-ID und Zahl (nutzung_tag, Kanal "app"), die Antwort
      // wartet nie darauf.
      if (!url.searchParams.has("kanal")) zaehleImHintergrund(context, kundenId, "app");

      return jsonAntwort({
        success: true,
        kundenId,
        branding: { ...branding, ...rechtLinks },
        beitraege: supabaseBeitraege,
        sponsors: supabaseSponsoren,
      });
    }

    if (action === "get_branding") {
      const kundenId = url.searchParams.get("kundenId") || "";
      const [imSupabase, supabaseBranding] = await Promise.all([
        istSupabaseKunde(kundenId),
        fetchSupabaseBranding(kundenId),
      ]);

      const fehler = leseFehler(imSupabase, [supabaseBranding]);
      if (fehler) return fehlerAntwort(fehler, kundenId);

      const branding = filterBranding(supabaseBranding);
      if (!brandingVollstaendig(branding)) return vereinsnameFehlt(kundenId);

      return jsonAntwort({ success: true, branding });
    }

    if (action === "get_beitraege") {
      const kundenId = url.searchParams.get("kundenId") || "";
      const [imSupabase, supabaseBeitraege] = await Promise.all([
        istSupabaseKunde(kundenId),
        fetchSupabaseBeitraege(kundenId),
      ]);

      const fehler = leseFehler(imSupabase, [supabaseBeitraege]);
      if (fehler) return fehlerAntwort(fehler, kundenId);

      // rows und beitraege, weil Tab1/feed.ts beide Schluessel lesen.
      return jsonAntwort({ success: true, rows: supabaseBeitraege, beitraege: supabaseBeitraege });
    }

    if (action === "get_sponsors") {
      const kundenId = url.searchParams.get("kundenId") || "";
      const [imSupabase, supabaseSponsoren] = await Promise.all([
        istSupabaseKunde(kundenId),
        fetchSupabaseSponsoren(kundenId),
      ]);

      const fehler = leseFehler(imSupabase, [supabaseSponsoren]);
      if (fehler) return fehlerAntwort(fehler, kundenId);

      return jsonAntwort({ success: true, sponsors: supabaseSponsoren });
    }

    if (action === "checkTeamLogin") {
      const kundenId = url.searchParams.get("kundenId") || "";
      const [imSupabase, hasTeamLogin] = await Promise.all([
        istSupabaseKunde(kundenId),
        fetchSupabaseHasTeamLogin(kundenId),
      ]);

      const fehler = leseFehler(imSupabase, [hasTeamLogin]);
      if (fehler) return fehlerAntwort(fehler, kundenId);

      if (hasTeamLogin === false) {
        // Kein Fehler, aber auffaellig: fehlender Schluessel/Policy liefert
        // ebenfalls eine leere Liste statt eines Fehlerstatus.
        console.warn("[Proxy] Supabase-Kunde ohne Team-Zugaenge (checkTeamLogin)", kundenId);
      }
      return jsonAntwort({ hasTeamLogin });
    }

    if (action === "getTeamRole") {
      const kundenId = url.searchParams.get("kundenId") || "";
      const password = url.searchParams.get("password") || "";
      if (!password) return jsonAntwort({ success: false });

      const [imSupabase, teamRole] = await Promise.all([
        istSupabaseKunde(kundenId),
        fetchSupabaseTeamRole(kundenId, password),
      ]);

      const fehler = leseFehler(imSupabase, [teamRole]);
      if (fehler) return fehlerAntwort(fehler, kundenId);

      // Treffer und "falsches Passwort" ({ success: false }) sind beide
      // definitive Antworten aus Supabase.
      return jsonAntwort(teamRole);
    }

    return nichtErlaubt();
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Proxy Fehler" }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }}
    );
  }
};

export const config = { path: "/api/proxy" };
