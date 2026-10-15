import { abrufMitWiederholung } from "./supabaseAbruf.ts";

// Uebersetzt die Supabase-"kunden"-Zeile (snake_case) in die Feldnamen,
// die die App im Branding-Objekt erwartet (PascalCase, wie frueher aus GAS).
const FIELD_MAP: Record<string, string> = {
  verein_name: "Verein_Name",
  thema_farbe: "Thema_Farbe",
  logo_verein: "Logo_Verein",
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
