// Live-Zeichen in der Kopfzeile (18.11.2026, Zweig live-zeichen):
// Läuft gerade ein Spiel DIESES Vereins auf live.onlang.de?
//
// Quelle: die öffentliche Liste https://live.onlang.de/oeffentlich/kanaele
// (dieselbe, die die Zuschauer-Seite nutzt). Der Live-Server erlaubt keine
// Abfrage direkt aus dem Handy (kein CORS) – darum fragt die App-Adresse
// selbst nach. Am Live-Server ändert sich nichts.
//
// Ein Kanal gehört zum Verein, wenn er mit "<Kunden-ID>-" beginnt
// (z. B. V002-1). Weitergegeben werden nur Mannschaften und Spielstand –
// dieselben Angaben, die jeder auf der Zuschauer-Seite sieht.
// Wirft nie: bei jedem Fehler "läuft nicht" (dann bleibt das Zeichen grau).

type Abruf = (url: string, init: RequestInit) => Promise<Response>;

export const LIVE_KANAELE_URL = "https://live.onlang.de/oeffentlich/kanaele";
const KUNDEN_ID_MUSTER = /^[A-Z]{1,4}[0-9]{1,4}$/;
const ZEITLIMIT_MS = 3000;

export type LiveSpiel = {
  kanal: string;
  heimTeam: string;
  gastTeam: string;
  heim: number | null;
  gast: number | null;
};

export type LiveStatus = { laeuft: boolean; spiele: LiveSpiel[] };

const NICHTS: LiveStatus = { laeuft: false, spiele: [] };

function text(wert: unknown): string {
  return typeof wert === "string" ? wert.slice(0, 80) : "";
}

function zahl(wert: unknown): number | null {
  return typeof wert === "number" && Number.isFinite(wert) ? wert : null;
}

export async function fetchLiveStatus(kundenId: string, abruf: Abruf = fetch): Promise<LiveStatus> {
  if (!KUNDEN_ID_MUSTER.test(kundenId)) return NICHTS;
  try {
    const antwort = await abruf(LIVE_KANAELE_URL, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(ZEITLIMIT_MS),
    });
    if (!antwort.ok) {
      console.warn("[Live-Zeichen] Status", antwort.status);
      return NICHTS;
    }
    const daten = await antwort.json();
    const liste = Array.isArray(daten?.kanaele) ? daten.kanaele : [];
    const spiele: LiveSpiel[] = liste
      .filter((k: { kanal?: unknown }) => typeof k?.kanal === "string" && k.kanal.startsWith(kundenId + "-"))
      .slice(0, 5)
      .map((k: Record<string, unknown>) => ({
        kanal: text(k.kanal),
        heimTeam: text(k.heimTeam),
        gastTeam: text(k.gastTeam),
        heim: zahl(k.heim),
        gast: zahl(k.gast),
      }));
    return { laeuft: spiele.length > 0, spiele };
  } catch (fehler) {
    console.warn("[Live-Zeichen] Abfrage fehlgeschlagen", fehler);
    return NICHTS;
  }
}
