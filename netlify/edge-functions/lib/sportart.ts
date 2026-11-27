// Sportart fuer Symbole auf Website und App (27.11.2026, Zweig sport-symbol).
// Quelle: kunden.sportarten. Gleiche Fussball-Erkennung wie der Live-Server
// (server/sportart.js) und der Admin (liveHighlights.ts).
//   Fussball            -> "fussball"   (⚽)
//   Basketball oder leer -> "basketball" (🏀, wie bisher – viele alte
//                           Basketball-Vereine haben keine Sportart eingetragen)
//   alles andere         -> "neutral"    (kein Sport-Symbol)
// Gleiche Regel in onlang-web (netlify/edge-functions/lib/sportart.ts):
// aendert sich hier etwas, dort mitaendern.

export type SportAnzeige = "fussball" | "basketball" | "neutral";

const FUSSBALL_MUSTER = /fu(ß|ss)ball|football|soccer|labdarúgás|labdarugas|foci/i;
const BASKETBALL_MUSTER = /basketball|kosárlabda|kosarlabda|kosár|kosar/i;

export function sportAnzeige(sportarten: unknown): SportAnzeige {
  const liste = (Array.isArray(sportarten) ? sportarten : [])
    .map((s) => String(s ?? "").trim())
    .filter(Boolean);
  if (liste.some((s) => FUSSBALL_MUSTER.test(s))) return "fussball";
  if (!liste.length || liste.some((s) => BASKETBALL_MUSTER.test(s))) return "basketball";
  return "neutral";
}
