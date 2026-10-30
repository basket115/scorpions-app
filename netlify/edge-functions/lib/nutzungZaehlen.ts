// Nutzungszaehlung fuer das Betreiber-Dashboard (Tabelle nutzung_tag,
// Funktion nutzung_zaehlen, onlang-supabase sql/034). Gegenstueck zu
// onlang-web lib/nutzungZaehlen.ts, hier nur Kanal "app". Gezaehlt werden nur
// Kunden-ID und Kanal - keine Person, keine IP, kein Cookie, keine
// Geraete-ID.
//
// Zaehlen darf nie stoeren: zaehleNutzung wirft nie und wartet hoechstens
// ZAEHL_LIMIT_MS. zaehleImHintergrund laesst es nach der Antwort zu Ende
// laufen (waitUntil) - die Seite wartet nie darauf.

import type { Context } from "https://edge.netlify.com";
import { getSecretCredentials } from "./supabaseSecret.ts";

export type NutzungsKanal = "app";

const LOG = "[Nutzung]";
const ZAEHL_LIMIT_MS = 3000;

export async function zaehleNutzung(kundenId: string, kanal: NutzungsKanal): Promise<void> {
  try {
    const creds = getSecretCredentials(LOG);
    if (!creds) return;
    const response = await fetch(`${creds.supabaseUrl}/rest/v1/rpc/nutzung_zaehlen`, {
      method: "POST",
      headers: { apikey: creds.secretKey, "Content-Type": "application/json" },
      body: JSON.stringify({ p_kunden_id: kundenId, p_kanal: kanal }),
      signal: AbortSignal.timeout(ZAEHL_LIMIT_MS),
    });
    if (!response.ok) console.error(`${LOG} Unerwarteter Status`, kanal, response.status);
    await response.body?.cancel();
  } catch (error) {
    console.error(`${LOG} Nicht gezaehlt`, kanal, (error as Error)?.name ?? "");
  }
}

// Arbeit nach der Antwort weiterlaufen lassen, ohne darauf zu warten.
// Ohne waitUntil laeuft sie trotzdem an (nur ohne Garantie, dass sie fertig
// wird) - die Antwort wird nie aufgehalten.
export function imHintergrund(context: Context | undefined, arbeit: Promise<unknown>): void {
  const warteBis = (context as unknown as { waitUntil?: (p: Promise<unknown>) => void } | undefined)?.waitUntil;
  if (typeof warteBis !== "function") return;
  try {
    warteBis.call(context, arbeit);
  } catch {
    // laeuft trotzdem weiter
  }
}

export function zaehleImHintergrund(context: Context | undefined, kundenId: string, kanal: NutzungsKanal): void {
  imHintergrund(context, zaehleNutzung(kundenId, kanal));
}
