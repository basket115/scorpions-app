import { abrufMitWiederholung } from "./supabaseAbruf.ts";

// Uebersetzt die Supabase-"kunden"-Zeile (snake_case) in die Feldnamen,
// die die App im Branding-Objekt erwartet (PascalCase, wie frueher aus GAS).
const FIELD_MAP: Record<string, string> = {
  verein_name: "Verein_Name",
  thema_farbe: "Thema_Farbe",
  // Akzentfarbe für Knöpfe, wenn die Vereinsfarbe zu dunkel ist (wie Website).
  akzent_farbe: "Akzent_Farbe",
  logo_verein: "Logo_Verein",
  // Hintergrund hinter dem Vereinslogo (hell/dunkel/ohne), wie auf der Website.
  logo_hintergrund: "Logo_Hintergrund",
  kunden_id: "Kunden_ID",
  sprache: "Sprache",
  status: "Status",
  kategorien: "Kategorien",
  parent_id: "Parent_ID",
  demo_ende: "Demo_Ende",
  readonly: "ReadOnly",
  logo_sponsor: "Logo_Sponsor",
  web_url: "WEB_URL",
  facebook_url: "Facebook_URL",
  // Bewusst der GAS-Schreibfehler: Tab1 liest Instragram_URL vor
  // Instagram_URL, so ueberschreibt der Supabase-Wert den GAS-Wert sauber.
  instagram_url: "Instragram_URL",
  youtube_url: "Youtube_URL",
  tiktok_url: "TikTok_URL",
  whatsapp_url: "WhatsApp_URL",
  // Nur in Supabase, nicht in GAS: Kurzname und eigene App-Icons.
  short_name: "Short_Name",
  app_icon_192: "App_Icon_192",
  app_icon_512: "App_Icon_512",
};

type SupabaseKundenRow = Record<string, unknown>;

// Liest per read-only-Key (SUPABASE_ANON_KEY) das Branding fuer einen Kunden.
// Wirft nie - jeder Fehler (fehlende Env-Vars, Netzwerk, Timeout auch beim
// zweiten Versuch, leeres Ergebnis) liefert null.
export async function fetchSupabaseBranding(
  kundenId: string
): Promise<Record<string, unknown> | null> {
  if (!kundenId) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[Supabase Branding] SUPABASE_URL/SUPABASE_ANON_KEY nicht gesetzt");
    return null;
  }

  try {
    const requestUrl = `${supabaseUrl}/rest/v1/kunden?kunden_id=eq.${encodeURIComponent(kundenId)}&select=*`;
    const response = await abrufMitWiederholung(requestUrl, {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    }, "[Supabase Branding]");

    if (!response.ok) {
      console.error("[Supabase Branding] Unerwarteter Status", response.status);
      return null;
    }

    const rows = (await response.json()) as SupabaseKundenRow[];
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return null;

    const branding: Record<string, unknown> = {};
    for (const [supabaseField, appField] of Object.entries(FIELD_MAP)) {
      const value = row[supabaseField];
      if (value !== undefined && value !== null) {
        branding[appField] = value;
      }
    }
    return Object.keys(branding).length ? branding : null;
  } catch (error) {
    console.error("[Supabase Branding] Laden fehlgeschlagen", error);
    return null;
  }
}

// Links zu Impressum und Datenschutz des Vereins fuer den Fuss der App: ein
// fertiger Text aus dem Admin (Seite verein-recht.html, Regel wie dort: kein
// offener Platzhalter "[[") geht vor dem eingetragenen Link. Leer = kein Link.
// Fehlen die Text-Spalten noch (SQL 040), gelten nur die Links. Wirft nie.
export function rechtLinksAus(kundenId: string, zeile: Record<string, unknown> | undefined): Record<string, string> {
  const links: Record<string, string> = {};
  for (const [seite, feld] of [["impressum", "Impressum_Link"], ["datenschutz", "Datenschutz_Link"]]) {
    const text = String(zeile?.[`${seite}_text`] ?? "").trim();
    const link = String(zeile?.[`${seite}_url`] ?? "").trim();
    if (text && !text.includes("[[")) {
      links[feld] = `https://app.onlang.de/verein-recht.html?kunde=${encodeURIComponent(kundenId)}&seite=${seite}`;
    } else if (/^https:\/\/\S+$/i.test(link)) {
      links[feld] = link;
    }
  }
  return links;
}

export async function fetchRechtLinks(kundenId: string): Promise<Record<string, string>> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!kundenId || !supabaseUrl || !supabaseAnonKey) return {};
  const lese = async (spalten: string) => {
    const antwort = await fetch(
      `${supabaseUrl}/rest/v1/website_einstellungen?kunden_id=eq.${encodeURIComponent(kundenId)}&select=${spalten}`,
      { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` }, signal: AbortSignal.timeout(4000) },
    );
    if (!antwort.ok) {
      await antwort.body?.cancel();
      return null;
    }
    const zeilen = await antwort.json();
    return Array.isArray(zeilen) ? zeilen as Record<string, unknown>[] : null;
  };
  try {
    const zeilen = await lese("impressum_url,datenschutz_url,impressum_text,datenschutz_text") ??
      await lese("impressum_url,datenschutz_url");
    return rechtLinksAus(kundenId, zeilen?.[0]);
  } catch {
    return {};
  }
}

// Prueft, ob ein Kunde in Supabase gefuehrt wird (Zeile in "kunden").
// true/false bei erfolgreicher Anfrage, null nur bei technischem Fehler
// (fehlende Env-Vars, Netzwerk, Timeout auch beim zweiten Versuch).
export async function istSupabaseKunde(kundenId: string): Promise<boolean | null> {
  if (!kundenId) return false;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[Supabase Kunde] SUPABASE_URL/SUPABASE_ANON_KEY nicht gesetzt");
    return null;
  }

  try {
    const requestUrl =
      `${supabaseUrl}/rest/v1/kunden?kunden_id=eq.${encodeURIComponent(kundenId)}` +
      `&select=kunden_id&limit=1`;
    const response = await abrufMitWiederholung(requestUrl, {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    }, "[Supabase Kunde]");

    if (!response.ok) {
      console.error("[Supabase Kunde] Unerwarteter Status", response.status);
      return null;
    }

    const rows = (await response.json()) as SupabaseKundenRow[];
    if (!Array.isArray(rows)) return null;

    return rows.length > 0;
  } catch (error) {
    console.error("[Supabase Kunde] Laden fehlgeschlagen", error);
    return null;
  }
}
