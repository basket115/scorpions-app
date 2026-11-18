// Tests ohne Netz fuer das Live-Zeichen (lib/liveStatus.ts).
// Ausfuehren: deno test netlify/edge-functions/lib/liveStatus.test.ts
import { fetchLiveStatus, LIVE_KANAELE_URL } from "./liveStatus.ts";

function gleich(ist: unknown, soll: unknown, was: string) {
  if (JSON.stringify(ist) !== JSON.stringify(soll)) {
    throw new Error(`${was}: erwartet ${JSON.stringify(soll)}, bekommen ${JSON.stringify(ist)}`);
  }
}

function attrappe(status: number, koerper: string | Error) {
  const aufrufe: string[] = [];
  const abruf = (url: string, _init: RequestInit) => {
    aufrufe.push(url);
    if (koerper instanceof Error) return Promise.reject(koerper);
    return Promise.resolve(new Response(koerper, { status }));
  };
  return { abruf, aufrufe };
}

const LISTE = JSON.stringify({
  success: true,
  kanaele: [
    { kanal: "V002-1", heimTeam: "Scorpions", gastTeam: "Urdenbach", heim: 24, gast: 18, viertel: 2, bezeichnung: "U14" },
    { kanal: "V0021-1", heimTeam: "Fremd", gastTeam: "Andere", heim: 1, gast: 2 },
    { kanal: "HU001-2", heimTeam: "Darazsak", gastTeam: "Gast", heim: 0, gast: 0 },
  ],
});

Deno.test("eigenes Spiel laeuft: nur Kanaele mit '<ID>-' am Anfang", async () => {
  const a = attrappe(200, LISTE);
  const s = await fetchLiveStatus("V002", a.abruf);
  gleich(a.aufrufe, [LIVE_KANAELE_URL], "eine Abfrage an die oeffentliche Liste");
  gleich(s, { laeuft: true, spiele: [{ kanal: "V002-1", heimTeam: "Scorpions", gastTeam: "Urdenbach", heim: 24, gast: 18 }] }, "Ergebnis");
});

Deno.test("anderer Verein: laeuft nicht", async () => {
  gleich(await fetchLiveStatus("T001", attrappe(200, LISTE).abruf), { laeuft: false, spiele: [] }, "T001");
});

Deno.test("leere Liste, Fehlerstatus, kaputtes JSON, Netzfehler: laeuft nicht", async () => {
  gleich((await fetchLiveStatus("V002", attrappe(200, '{"success":true,"kanaele":[]}').abruf)).laeuft, false, "leer");
  gleich((await fetchLiveStatus("V002", attrappe(502, "Bad Gateway").abruf)).laeuft, false, "502");
  gleich((await fetchLiveStatus("V002", attrappe(200, "kein json").abruf)).laeuft, false, "kaputt");
  gleich((await fetchLiveStatus("V002", attrappe(200, new Error("weg")).abruf)).laeuft, false, "Netz");
});

Deno.test("ungueltige Kunden-ID: keine Abfrage", async () => {
  const a = attrappe(200, LISTE);
  gleich((await fetchLiveStatus("v002;drop", a.abruf)).laeuft, false, "Ergebnis");
  gleich(a.aufrufe.length, 0, "keine Abfrage");
});
