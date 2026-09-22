// Team-Login gegen die Supabase-Tabelle "team_zugaenge". Diese Tabelle
// hat bewusst KEINE oeffentliche Lese-Policy - jeder Zugriff hier laeuft
// ausschliesslich ueber den GEHEIMEN SUPABASE_SERVICE_ROLE_KEY, der RLS
// umgeht und NIE an den Browser weitergegeben werden darf.

type SupabaseTeamRow = Record<string, unknown>;

function getServiceCredentials(): { supabaseUrl: string; serviceRoleKey: string } | null {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[Supabase Team] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY nicht gesetzt");
    return null;
  }
  return { supabaseUrl, serviceRoleKey };
}

// Prueft nur, OB es fuer einen Kunden ueberhaupt Team-Zugaenge gibt -
// liefert nie das Passwort mit. true/false bei erfolgreicher Anfrage,
// null nur bei echtem technischem Fehler (dann faellt der Proxy auf
// GAS zurueck).
export async function fetchSupabaseHasTeamLogin(
  kundenId: string
): Promise<boolean | null> {
  if (!kundenId) return null;

  const creds = getServiceCredentials();
  if (!creds) return null;

  try {
    const orFilter = `or=(team_id.eq.${encodeURIComponent(kundenId)},team_id.like.${encodeURIComponent(kundenId)}-*)`;
    const requestUrl = `${creds.supabaseUrl}/rest/v1/team_zugaenge?${orFilter}&select=team_id&limit=1`;
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        apikey: creds.serviceRoleKey,
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      console.error("[Supabase Team] Unerwarteter Status (hasTeamLogin)", response.status);
      return null;
    }

    const rows = (await response.json()) as SupabaseTeamRow[];
    if (!Array.isArray(rows)) return null;

    return rows.length > 0;
  } catch (error) {
    console.error("[Supabase Team] Laden fehlgeschlagen (hasTeamLogin)", error);
    return null;
  }
}

type TeamRoleResult =
  | { success: true; team_id: string; mannschaft: string; rolle: string; kundenId: string }
  | { success: false };

// Prueft Kunden-ID + Passwort gegen aktive Team-Zugaenge. Das Passwort
// wird NIE als Supabase-Query-Filter verschickt - die aktiven Zeilen
// werden geholt und der Vergleich passiert hier im Code. Ein Treffer
// liefert nur die freigegebenen Felder zurueck, nie die rohe Zeile
// (also nie "passwort"). Kein Treffer/falsches Passwort ist eine
// definitive Antwort (success:false), kein Fehlerfall. null bedeutet
// echter technischer Fehler - dann faellt der Proxy auf GAS zurueck.
export async function fetchSupabaseTeamRole(
  kundenId: string,
  password: string
): Promise<TeamRoleResult | null> {
  if (!kundenId || !password) return null;

  const creds = getServiceCredentials();
  if (!creds) return null;

  try {
    const requestUrl =
      `${creds.supabaseUrl}/rest/v1/team_zugaenge` +
      `?kunden_id=eq.${encodeURIComponent(kundenId)}` +
      `&aktiv=eq.true` +
      `&select=team_id,mannschaft,rolle,passwort`;
    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        apikey: creds.serviceRoleKey,
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      console.error("[Supabase Team] Unerwarteter Status (getTeamRole)", response.status);
      return null;
    }

    const rows = (await response.json()) as SupabaseTeamRow[];
    if (!Array.isArray(rows)) return null;

    const treffer = rows.find((row) => String(row.passwort ?? "") === password);
    if (!treffer) return { success: false };

    return {
      success: true,
      team_id: String(treffer.team_id ?? ""),
      mannschaft: String(treffer.mannschaft ?? ""),
      rolle: String(treffer.rolle ?? ""),
      kundenId,
    };
  } catch (error) {
    console.error("[Supabase Team] Laden fehlgeschlagen (getTeamRole)", error);
    return null;
  }
}
