// Schreibzugriff auf die Supabase-Tabelle "beitraege". Jeder Zugriff hier
// laeuft ueber den GEHEIMEN SUPABASE_SECRET_KEY (nur apikey-Header), der
// NIE an den Browser weitergegeben werden darf. Vor jedem Schreiben wird
// der Zugang serverseitig gegen "team_zugaenge" geprueft.

type SupabaseRow = Record<string, unknown>;

function getSecretCredentials(): { supabaseUrl: string; secretKey: string } | null {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const secretKey = Deno.env.get("SUPABASE_SECRET_KEY");
  if (!supabaseUrl || !secretKey) {
    console.error("[Supabase Schreiben] SUPABASE_URL/SUPABASE_SECRET_KEY nicht gesetzt");
    return null;
  }
  return { supabaseUrl, secretKey };
}

export type Zugang = { rolle: string; mannschaft: string; kunden_id: string };

// Prueft team_id + Kunden-ID + Passwort gegen aktive Team-Zugaenge. Das
// Passwort wird NIE als Supabase-Query-Filter verschickt - der Vergleich
// passiert hier im Code. Nur wenn GENAU eine aktive Zeile passt, werden
// rolle, mannschaft und kunden_id AUS DER TABELLENZEILE zurueckgegeben.
// Sonst (kein Treffer, mehrere Treffer, technischer Fehler) null.
export async function pruefeZugang(
  kundenId: string,
  teamId: string,
  passwort: string
): Promise<Zugang | null> {
  if (!kundenId || !teamId || !passwort) return null;

  const creds = getSecretCredentials();
  if (!creds) return null;

  try {
    const requestUrl =
      `${creds.supabaseUrl}/rest/v1/team_zugaenge` +
      `?team_id=eq.${encodeURIComponent(teamId)}` +
      `&kunden_id=eq.${encodeURIComponent(kundenId)}` +
      `&aktiv=eq.true` +
      `&select=*`;
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        apikey: creds.secretKey,
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      console.error("[Supabase Schreiben] Unerwarteter Status (pruefeZugang)", response.status);
      return null;
    }

    const rows = (await response.json()) as SupabaseRow[];
    if (!Array.isArray(rows)) return null;

    const treffer = rows.filter((row) => String(row.passwort ?? "") === passwort);
    if (treffer.length !== 1) return null;

    return {
      rolle: String(treffer[0].rolle ?? ""),
      mannschaft: String(treffer[0].mannschaft ?? ""),
      kunden_id: String(treffer[0].kunden_id ?? ""),
    };
  } catch (error) {
    console.error("[Supabase Schreiben] Laden fehlgeschlagen (pruefeZugang)", error);
    return null;
  }
}

export type NeuerBeitrag = {
  kunden_id: string;
  titel: string;
  text: string;
  bild_url: string;
  video_url: string;
  kategorie: string;
};

// Legt einen Beitrag an. Keine id (erzeugt die DB), datum setzt der Server
// als aktuellen Zeitpunkt (ISO). Liefert die angelegte Zeile, sonst null.
export async function createBeitrag(daten: NeuerBeitrag): Promise<SupabaseRow | null> {
  if (!daten.kunden_id) return null;

  const creds = getSecretCredentials();
  if (!creds) return null;

  try {
    const response = await fetch(`${creds.supabaseUrl}/rest/v1/beitraege`, {
      method: "POST",
      headers: {
        apikey: creds.secretKey,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        kunden_id: daten.kunden_id,
        titel: daten.titel,
        text: daten.text,
        bild_url: daten.bild_url,
        video_url: daten.video_url,
        kategorie: daten.kategorie,
        datum: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      console.error("[Supabase Schreiben] Unerwarteter Status (createBeitrag)", response.status, await response.text());
      return null;
    }

    const rows = (await response.json()) as SupabaseRow[];
    if (!Array.isArray(rows) || rows.length !== 1) return null;

    return rows[0];
  } catch (error) {
    console.error("[Supabase Schreiben] Speichern fehlgeschlagen (createBeitrag)", error);
    return null;
  }
}
