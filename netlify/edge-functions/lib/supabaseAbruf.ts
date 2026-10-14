// Gemeinsame Regeln fuer die Lese-Abrufe der Edge-Funktionen bei Supabase.
//
// Zeitlimit je Versuch 3 s. Bei Zeitlimit oder Netzwerkfehler genau EIN
// zweiter Versuch (hoechstens ca. 6 s). Eine Antwort mit Fehlerstatus
// (z. B. 400 oder 500) wird nicht wiederholt - Supabase hat dann geantwortet.
// Schreibende Abrufe nutzen das bewusst nicht: ein wiederholtes Schreiben
// koennte doppelt speichern.
export const ZEITLIMIT_MS = 3000;

type Abruf = (url: string, init: RequestInit) => Promise<Response>;

export async function abrufMitWiederholung(
  url: string,
  init: RequestInit,
  name: string,
  abruf: Abruf = fetch,
  zeitlimitMs: number = ZEITLIMIT_MS
): Promise<Response> {
  try {
    return await abruf(url, { ...init, signal: AbortSignal.timeout(zeitlimitMs) });
  } catch (fehler) {
    console.warn(`${name} erster Versuch fehlgeschlagen, zweiter Versuch`, fehler);
    return await abruf(url, { ...init, signal: AbortSignal.timeout(zeitlimitMs) });
  }
}

// Fehlerantworten des Proxys. Es gibt keinen GAS-Rueckfall mehr: scheitert
// Supabase, bekommt die App eine klare Fehlermeldung - nie ein leeres
// Branding als Erfolg.
export const FEHLER_NICHT_GEFUNDEN = "Kunde nicht gefunden";
export const FEHLER_SUPABASE = "Daten konnten nicht geladen werden (Supabase nicht erreichbar)";
export const FEHLER_VEREINSNAME = "Vereinsdaten unvollstaendig (kein Vereinsname)";

export type LeseFehler = { status: number; error: string };

// imSupabase: true/false aus istSupabaseKunde, null = technischer Fehler.
// teile: die uebrigen Ergebnisse (null = technischer Fehler).
export function leseFehler(imSupabase: boolean | null, teile: unknown[]): LeseFehler | null {
  if (imSupabase === false) return { status: 404, error: FEHLER_NICHT_GEFUNDEN };
  if (imSupabase !== true || teile.some((teil) => teil === null || teil === undefined)) {
    return { status: 503, error: FEHLER_SUPABASE };
  }
  return null;
}

// Ein Branding ohne Vereinsnamen gilt nie als Erfolg (die App zeigte dann
// "Sport App" ohne Farbe und Logo).
export function brandingVollstaendig(branding: Record<string, unknown> | null): boolean {
  return !!branding && String(branding.Verein_Name ?? "").trim() !== "";
}
