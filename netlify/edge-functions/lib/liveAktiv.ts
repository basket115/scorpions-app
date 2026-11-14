// Live-Knopf "🎥 Spiel übertragen" (gebündelter Livegang, 14.11.2026):
// Hat der Verein mindestens einen aktiven Live-Zugang (Tabelle
// live_zugaenge, SQL 049)? Dann zeigt die App den Knopf im Fußbereich.
//
// live_zugaenge ist nur mit dem GEHEIMEN Schlüssel lesbar (RLS ohne Policy).
// Gefragt wird nur "gibt es eine aktive Zeile" – keine Namen, keine
// Benutzernamen, nichts davon geht an den Browser, nur true/false.
// Wirft nie: bei jedem Fehler false (dann eben kein Knopf).

import { getSecretCredentials } from "./supabaseSecret.ts";

type Abruf = (url: string, init: RequestInit) => Promise<Response>;

const KUNDEN_ID_MUSTER = /^[A-Z]{1,4}[0-9]{1,4}$/;
const ZEITLIMIT_MS = 4000;

export async function fetchLiveAktiv(kundenId: string, abruf: Abruf = fetch): Promise<boolean> {
  if (!KUNDEN_ID_MUSTER.test(kundenId)) return false;
  const creds = getSecretCredentials("[Live-Knopf]");
  if (!creds) return false;
  try {
    const antwort = await abruf(
      `${creds.supabaseUrl}/rest/v1/live_zugaenge?kunden_id=eq.${encodeURIComponent(kundenId)}` +
        `&aktiv=eq.true&select=id&limit=1`,
      {
        headers: { apikey: creds.secretKey, Authorization: `Bearer ${creds.secretKey}` },
        signal: AbortSignal.timeout(ZEITLIMIT_MS),
      }
    );
    if (!antwort.ok) {
      console.warn("[Live-Knopf] Status", antwort.status);
      return false;
    }
    const zeilen = await antwort.json();
    return Array.isArray(zeilen) && zeilen.length > 0;
  } catch (fehler) {
    console.warn("[Live-Knopf] Abfrage fehlgeschlagen", fehler);
    return false;
  }
}
