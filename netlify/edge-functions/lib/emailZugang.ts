// Zugang mit E-Mail-Login (Supabase Auth) – derselbe Login wie Studio und
// Admin. Das Login-Token prueft Supabase Auth selbst (abgelaufen, gefaelscht,
// geloescht -> abgelehnt). Verein und Rolle kommen danach NUR aus der
// Tabelle "benutzer" (aktiv). Aus dem Browser wird dafuer nichts uebernommen
// ausser dem Token und der Kunden-ID, die mit "benutzer" uebereinstimmen muss.
//
// Ergebnis wie pruefeZugang() (team_zugaenge), damit die Schreib-Aktionen
// beide Wege gleich behandeln. Rolle "admin" darf alles; andere Rollen
// (z. B. spaeter "team" mit Mannschaft) bekommen hier noch keine Mannschaft
// und duerfen damit nichts schreiben.

import { getSecretCredentials } from "./supabaseSecret.ts";
import type { Zugang } from "./supabaseBeitraegeSchreiben.ts";

const LOG = "[E-Mail-Zugang]";
const ZEITLIMIT_MS = 5000;
const USER_ID_MUSTER = /^[0-9a-f-]{36}$/i;

export type EmailZugangErgebnis =
  | { status: "ok"; zugang: Zugang }
  | { status: "kein_login" }        // kein oder ungueltiges Token
  | { status: "anderer_verein" }    // Login gehoert zu einem anderen Verein
  | { status: "kein_zugang" }       // Login ohne aktive Zeile in benutzer
  | { status: "gesperrt" }          // Testphase beendet (ABGELAUFEN/GEKUENDIGT)
  | { status: "fehler" };           // technischer Fehler

export function bearerToken(request: Request): string {
  const kopf = request.headers.get("authorization") ?? "";
  return /^bearer\s+/i.test(kopf) ? kopf.replace(/^bearer\s+/i, "").trim() : "";
}

export async function pruefeEmailZugang(token: string, kundenId: string): Promise<EmailZugangErgebnis> {
  if (!token) return { status: "kein_login" };
  const creds = getSecretCredentials(LOG);
  if (!creds) return { status: "fehler" };
  const kopf = { apikey: creds.secretKey };

  try {
    // 1) Login pruefen
    const auth = await fetch(`${creds.supabaseUrl}/auth/v1/user`, {
      headers: { ...kopf, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(ZEITLIMIT_MS),
    });
    if (auth.status === 401 || auth.status === 403) return { status: "kein_login" };
    if (!auth.ok) {
      console.error(LOG, "Auth Status", auth.status);
      return { status: "fehler" };
    }
    const user = await auth.json();
    const userId = String(user?.id ?? "");
    if (!USER_ID_MUSTER.test(userId)) return { status: "kein_login" };

    // 2) Verein und Rolle nur aus "benutzer"
    const b = await fetch(
      `${creds.supabaseUrl}/rest/v1/benutzer?user_id=eq.${userId}&aktiv=eq.true&select=kunden_id,rolle`,
      { headers: kopf, signal: AbortSignal.timeout(ZEITLIMIT_MS) }
    );
    if (!b.ok) {
      console.error(LOG, "benutzer Status", b.status);
      return { status: "fehler" };
    }
    const zeilen = (await b.json()) as { kunden_id?: string; rolle?: string }[];
    if (!Array.isArray(zeilen) || zeilen.length !== 1) return { status: "kein_zugang" };
    const vereinDesLogins = String(zeilen[0].kunden_id ?? "");
    if (!kundenId || vereinDesLogins !== kundenId) return { status: "anderer_verein" };

    // 3) Testphase beendet: auch in der App nicht mehr schreiben (wie Studio/Admin)
    const k = await fetch(
      `${creds.supabaseUrl}/rest/v1/kunden?kunden_id=eq.${encodeURIComponent(vereinDesLogins)}&select=status`,
      { headers: kopf, signal: AbortSignal.timeout(ZEITLIMIT_MS) }
    );
    if (!k.ok) {
      console.error(LOG, "kunden Status", k.status);
      return { status: "fehler" };
    }
    const kunde = ((await k.json()) as { status?: string }[])[0];
    const status = String(kunde?.status ?? "").trim().toUpperCase();
    if (status === "ABGELAUFEN" || status === "GEKUENDIGT") return { status: "gesperrt" };

    const rolle = String(zeilen[0].rolle ?? "") === "admin" ? "admin" : "team";
    return { status: "ok", zugang: { rolle, mannschaft: "", kunden_id: vereinDesLogins } };
  } catch (error) {
    console.error(LOG, "nicht erreichbar", error instanceof Error ? error.name : "");
    return { status: "fehler" };
  }
}
