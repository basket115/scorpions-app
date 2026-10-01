// Uebersetzt Supabase-"sponsoren"-Zeilen (snake_case) in die Feldnamen,
// die das Frontend aus der GAS-Antwort "sponsors" erwartet (PascalCase
// mit Unterstrichen, id bleibt id).
const FIELD_MAP: Record<string, string> = {
  kunden_id: "Kunden_ID",
  logo_url: "Logo_URL",
  banner_text: "Banner_Text",
  banner_bild_url: "Banner_Bild_URL",
  banner_link_url: "Banner_Link_URL",
  aktiv: "Aktiv",
};

type SupabaseSponsorRow = Record<string, unknown>;

// Zeilen mit gefuelltem "slot" (z. B. HERO_RIGHT) sind nur fuer die
// Websites gedacht und gehoeren nicht in die App.
function hatSlot(row: SupabaseSponsorRow): boolean {
  return String(row.slot ?? "").trim() !== "";
}

// Liest per read-only-Key (SUPABASE_ANON_KEY) die aktiven Sponsoren fuer
// einen Kunden, ohne Zeilen mit "slot". Wirft nie - ein echter Fehler
// (fehlende Env-Vars, Netzwerk, Timeout) liefert null, damit der
// aufrufende Proxy auf die GAS-Sponsoren zurueckfallen kann. Kein Treffer
// ist KEIN Fehler und liefert eine leere Liste - den ONLANG-Standard-Sponsor
// zeigt nur die App (Tab1.tsx), in der Sprache der App.
export async function fetchSupabaseSponsoren(
  kundenId: string
): Promise<Record<string, unknown>[] | null> {
  if (!kundenId) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[Supabase Sponsoren] SUPABASE_URL/SUPABASE_ANON_KEY nicht gesetzt");
    return null;
  }

  try {
    const requestUrl = `${supabaseUrl}/rest/v1/sponsoren?kunden_id=eq.${encodeURIComponent(kundenId)}&aktiv=eq.true&select=*&order=position.asc.nullslast,id.asc`;
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      console.error("[Supabase Sponsoren] Unerwarteter Status", response.status);
      return null;
    }

    const rows = (await response.json()) as SupabaseSponsorRow[];
    if (!Array.isArray(rows)) return null;

    return rows.filter((row) => !hatSlot(row)).map((row) => {
      const sponsor: Record<string, unknown> = { id: row.id };
      for (const [supabaseField, appField] of Object.entries(FIELD_MAP)) {
        const value = row[supabaseField];
        if (value !== undefined && value !== null) {
          sponsor[appField] = value;
        }
      }
      return sponsor;
    });
  } catch (error) {
    console.error("[Supabase Sponsoren] Laden fehlgeschlagen", error);
    return null;
  }
}
