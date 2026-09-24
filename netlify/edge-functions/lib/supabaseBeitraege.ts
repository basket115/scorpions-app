// Uebersetzt Supabase-"beitraege"-Zeilen (snake_case) in die Feldnamen,
// die die App im Bootstrap-Beitraege-Array erwartet (PascalCase, id bleibt id).
const FIELD_MAP: Record<string, string> = {
  titel: "Titel",
  text: "Text",
  bild_url: "Bild_URL",
  video_url: "Video_URL",
  kategorie: "Kategorie",
  datum: "Datum",
};

type SupabaseBeitragRow = Record<string, unknown>;

// Liefert einen Sortierwert (ms seit Epoch) fuer datum/erstellt_am.
// Unparsebares/leeres liefert 0, damit es ans Ende der Sortierung faellt.
function parseSortKey(value: unknown): number {
  if (value === null || value === undefined) return 0;

  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return 0;

    // DD.MM.YYYY oder D.M.YYYY mit optionaler Uhrzeit
    const m = trimmed.match(
      /^(\d{1,2})\.(\d{1,2})\.(\d{3,4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
    );
    if (m) {
      const dd = Number(m[1]);
      const mm = Number(m[2]);
      let yyyy = Number(m[3]);
      if (yyyy < 1000) yyyy = 2000 + yyyy;
      const hh = m[4] ? Number(m[4]) : 0;
      const min = m[5] ? Number(m[5]) : 0;
      const sec = m[6] ? Number(m[6]) : 0;
      const d = new Date(yyyy, mm - 1, dd, hh, min, sec, 0);
      return isNaN(d.getTime()) ? 0 : d.getTime();
    }

    // ISO-String und alle anderen von Date parsebaren Formate
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }

  return 0;
}

// Liest per read-only-Key (SUPABASE_ANON_KEY) die Beitraege fuer einen Kunden.
// Wirft nie. Keine Beitraege -> [] (ob der Kunde ueberhaupt in Supabase
// ist, entscheidet der Proxy per istSupabaseKunde). null nur bei
// technischem Fehler (fehlende Env-Vars, Netzwerk, Timeout), damit der
// Proxy dann auf die GAS-Beitraege zurueckfallen kann.
export async function fetchSupabaseBeitraege(
  kundenId: string
): Promise<Record<string, unknown>[] | null> {
  if (!kundenId) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[Supabase Beitraege] SUPABASE_URL/SUPABASE_ANON_KEY nicht gesetzt");
    return null;
  }

  try {
    const requestUrl = `${supabaseUrl}/rest/v1/beitraege?kunden_id=eq.${encodeURIComponent(kundenId)}&select=*`;
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      console.error("[Supabase Beitraege] Unerwarteter Status", response.status);
      return null;
    }

    const rows = (await response.json()) as SupabaseBeitragRow[];
    if (!Array.isArray(rows)) return null;

    const beitraege = rows
      .filter((row) => row?.geloescht !== true)
      .map((row) => {
        const beitrag: Record<string, unknown> = { id: row.id };
        for (const [supabaseField, appField] of Object.entries(FIELD_MAP)) {
          const value = row[supabaseField];
          if (value !== undefined && value !== null) {
            beitrag[appField] = value;
          }
        }
        return {
          beitrag,
          sortKey: parseSortKey(row.datum) || parseSortKey(row.erstellt_am),
        };
      })
      .sort((a, b) => b.sortKey - a.sortKey)
      .map((entry) => entry.beitrag);

    return beitraege;
  } catch (error) {
    console.error("[Supabase Beitraege] Laden fehlgeschlagen", error);
    return null;
  }
}
