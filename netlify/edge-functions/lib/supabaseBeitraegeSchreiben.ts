// Schreibzugriff auf die Supabase-Tabelle "beitraege". Jeder Zugriff hier
// laeuft ueber den GEHEIMEN SUPABASE_SECRET_KEY (nur apikey-Header), der
// NIE an den Browser weitergegeben werden darf. Vor jedem Schreiben wird
// der Zugang serverseitig gegen "team_zugaenge" geprueft.

import { getSecretCredentials as getSecretCredentialsMitPrefix } from "./supabaseSecret.ts";
import { gleichesPasswort } from "./passwortVergleich.ts";

type SupabaseRow = Record<string, unknown>;

function getSecretCredentials() {
  return getSecretCredentialsMitPrefix("[Supabase Schreiben]");
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
      `&select=rolle,mannschaft,kunden_id,passwort`;
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

    const treffer = rows.filter((row) => gleichesPasswort(String(row.passwort ?? ""), passwort));
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

// Kategorie, in der ein Unteradmin (rolle "team") schreiben darf: seine
// Mannschaft ohne Leerzeichen am Rand. Leer = er darf nichts.
export function unteradminKategorie(zugang: Zugang): string {
  return zugang.rolle === "team" ? zugang.mannschaft.trim() : "";
}

// Hauptadmin (rolle "admin") darf jede Kategorie. Ein Unteradmin nur die,
// die genau seiner Mannschaft entspricht: Leerzeichen am Rand zaehlen
// nicht, Gross-/Kleinschreibung zaehlt. Alle anderen Rollen duerfen nichts.
export function darfKategorie(zugang: Zugang, kategorie: unknown): boolean {
  if (zugang.rolle === "admin") return true;
  const eigene = unteradminKategorie(zugang);
  return eigene !== "" && String(kategorie ?? "").trim() === eigene;
}

// Wie in der App (Tab1.tsx), wenn beim Verein keine Kategorien stehen.
const STANDARD_KATEGORIEN = ["News", "Spiel", "Training", "Sonstiges"];

// Kategorien des Vereins aus "kunden.kategorien" (Komma-Liste). null nur
// bei technischem Fehler oder unbekanntem Kunden.
export async function ladeVereinsKategorien(kundenId: string): Promise<string[] | null> {
  if (!kundenId) return null;

  const creds = getSecretCredentials();
  if (!creds) return null;

  try {
    const response = await fetch(
      `${creds.supabaseUrl}/rest/v1/kunden?kunden_id=eq.${encodeURIComponent(kundenId)}&select=kategorien`,
      {
        method: "GET",
        headers: {
          apikey: creds.secretKey,
        },
        signal: AbortSignal.timeout(4000),
      }
    );

    if (!response.ok) {
      console.error("[Supabase Schreiben] Unerwarteter Status (ladeVereinsKategorien)", response.status);
      return null;
    }

    const rows = (await response.json()) as SupabaseRow[];
    if (!Array.isArray(rows) || rows.length !== 1) return null;

    const wert = rows[0].kategorien;
    const liste = (Array.isArray(wert) ? wert : String(wert ?? "").split(","))
      .map((k) => String(k ?? "").trim())
      .filter(Boolean);
    return liste.length ? liste : STANDARD_KATEGORIEN;
  } catch (error) {
    console.error("[Supabase Schreiben] Laden fehlgeschlagen (ladeVereinsKategorien)", error);
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

export type BeitragAenderung = {
  titel: string;
  text: string;
  bild_url: string;
  video_url: string;
  // Leer = Kategorie bleibt unveraendert.
  kategorie: string;
};

// Liest einen bestehenden, nicht geloeschten Beitrag des Kunden und prueft,
// ob der Zugang dessen Kategorie aendern darf (darfKategorie). Liefert bei
// Erfolg den Filter fuer das anschliessende PATCH: beim Unteradmin haengt
// die gelesene Kategorie mit am Filter, damit ein Beitrag, der inzwischen
// die Kategorie gewechselt hat, nicht mehr getroffen wird.
async function pruefeBeitrag(
  creds: { supabaseUrl: string; secretKey: string },
  id: string,
  zugang: Zugang,
  aktion: string
): Promise<{ filter: string } | "nicht_gefunden" | "nicht_erlaubt" | null> {
  // geloescht=not.is.true statt eq.false, damit auch NULL als "nicht
  // geloescht" gilt - wie im Lesecode (supabaseBeitraege.ts).
  const filter =
    `?id=eq.${encodeURIComponent(id)}` +
    `&kunden_id=eq.${encodeURIComponent(zugang.kunden_id)}` +
    `&geloescht=not.is.true`;

  const leseResponse = await fetch(
    `${creds.supabaseUrl}/rest/v1/beitraege${filter}&select=id,kategorie`,
    {
      method: "GET",
      headers: {
        apikey: creds.secretKey,
      },
      signal: AbortSignal.timeout(4000),
    }
  );

  if (!leseResponse.ok) {
    console.error(`[Supabase Schreiben] Unerwarteter Status (${aktion} lesen)`, leseResponse.status);
    return null;
  }

  const vorhanden = (await leseResponse.json()) as SupabaseRow[];
  if (!Array.isArray(vorhanden)) return null;
  if (vorhanden.length !== 1) return "nicht_gefunden";
  if (!darfKategorie(zugang, vorhanden[0].kategorie)) return "nicht_erlaubt";

  if (zugang.rolle === "admin") return { filter };
  return { filter: `${filter}&kategorie=eq.${encodeURIComponent(String(vorhanden[0].kategorie ?? ""))}` };
}

// Aendert einen bestehenden, nicht geloeschten Beitrag des Kunden. Liest
// ihn vorher (id + kunden_id + geloescht nicht true) - gibt es ihn nicht,
// wird "nicht_gefunden" geliefert; darf der Zugang die Kategorie des
// Beitrags nicht aendern, "nicht_erlaubt". Geaendert werden NUR titel, text,
// bild_url, video_url und (wenn angegeben, nur Hauptadmin) kategorie; datum
// und erstellt_am bleiben unveraendert. Liefert die geaenderte Zeile, bei
// technischem Fehler null.
export async function updateBeitrag(
  id: string,
  zugang: Zugang,
  felder: BeitragAenderung
): Promise<SupabaseRow | "nicht_gefunden" | "nicht_erlaubt" | null> {
  if (!id || !zugang.kunden_id) return "nicht_gefunden";

  const creds = getSecretCredentials();
  if (!creds) return null;

  try {
    const pruefung = await pruefeBeitrag(creds, id, zugang, "updateBeitrag");
    if (!pruefung || typeof pruefung === "string") return pruefung;

    // Die Kategorie darf nur der Hauptadmin aendern - beim Unteradmin
    // bleibt der Beitrag in seiner Kategorie, egal was der Browser schickt.
    const neueKategorie = zugang.rolle === "admin" ? felder.kategorie : "";

    const response = await fetch(`${creds.supabaseUrl}/rest/v1/beitraege${pruefung.filter}`, {
      method: "PATCH",
      headers: {
        apikey: creds.secretKey,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        titel: felder.titel,
        text: felder.text,
        bild_url: felder.bild_url,
        video_url: felder.video_url,
        ...(neueKategorie ? { kategorie: neueKategorie } : {}),
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      console.error("[Supabase Schreiben] Unerwarteter Status (updateBeitrag)", response.status, await response.text());
      return null;
    }

    const rows = (await response.json()) as SupabaseRow[];
    if (!Array.isArray(rows)) return null;
    if (rows.length === 0) return "nicht_gefunden";
    if (rows.length !== 1) return null;

    return rows[0];
  } catch (error) {
    console.error("[Supabase Schreiben] Speichern fehlgeschlagen (updateBeitrag)", error);
    return null;
  }
}

// Loescht einen bestehenden, nicht geloeschten Beitrag des Kunden - aber
// NUR als Markierung (geloescht=true), die Zeile bleibt erhalten. Liest
// ihn vorher (id + kunden_id + geloescht nicht true) - gibt es ihn nicht,
// wird "nicht_gefunden" geliefert; darf der Zugang die Kategorie des
// Beitrags nicht aendern, "nicht_erlaubt". Liefert die markierte Zeile, bei
// technischem Fehler null.
export async function deleteBeitrag(
  id: string,
  zugang: Zugang
): Promise<SupabaseRow | "nicht_gefunden" | "nicht_erlaubt" | null> {
  if (!id || !zugang.kunden_id) return "nicht_gefunden";

  const creds = getSecretCredentials();
  if (!creds) return null;

  try {
    const pruefung = await pruefeBeitrag(creds, id, zugang, "deleteBeitrag");
    if (!pruefung || typeof pruefung === "string") return pruefung;

    const response = await fetch(`${creds.supabaseUrl}/rest/v1/beitraege${pruefung.filter}`, {
      method: "PATCH",
      headers: {
        apikey: creds.secretKey,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        geloescht: true,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      console.error("[Supabase Schreiben] Unerwarteter Status (deleteBeitrag)", response.status, await response.text());
      return null;
    }

    const rows = (await response.json()) as SupabaseRow[];
    if (!Array.isArray(rows)) return null;
    if (rows.length === 0) return "nicht_gefunden";
    if (rows.length !== 1) return null;

    return rows[0];
  } catch (error) {
    console.error("[Supabase Schreiben] Loeschen fehlgeschlagen (deleteBeitrag)", error);
    return null;
  }
}
