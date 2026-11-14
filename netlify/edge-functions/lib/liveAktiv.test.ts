// Tests ohne Netz fuer den Live-Knopf (lib/liveAktiv.ts).
// Ausfuehren: deno test --allow-env netlify/edge-functions/lib/liveAktiv.test.ts
import { fetchLiveAktiv } from "./liveAktiv.ts";

Deno.env.set("SUPABASE_URL", "https://beispiel.supabase.co");
Deno.env.set("SUPABASE_SECRET_KEY", "geheim-test");

function gleich(ist: unknown, soll: unknown, was: string) {
  if (JSON.stringify(ist) !== JSON.stringify(soll)) {
    throw new Error(`${was}: erwartet ${JSON.stringify(soll)}, bekommen ${JSON.stringify(ist)}`);
  }
}

function attrappe(status: number, koerper: string | Error) {
  const aufrufe: { url: string; init: RequestInit }[] = [];
  const abruf = (url: string, init: RequestInit) => {
    aufrufe.push({ url, init });
    if (koerper instanceof Error) return Promise.reject(koerper);
    return Promise.resolve(new Response(koerper, { status }));
  };
  return { abruf, aufrufe };
}

Deno.test("aktiver Live-Zugang: true, Abfrage nur nach id mit geheimem Schluessel", async () => {
  const a = attrappe(200, '[{"id":"x"}]');
  gleich(await fetchLiveAktiv("V002", a.abruf), true, "Ergebnis");
  gleich(a.aufrufe.length, 1, "ein Abruf");
  const url = a.aufrufe[0].url;
  gleich(url, "https://beispiel.supabase.co/rest/v1/live_zugaenge?kunden_id=eq.V002&aktiv=eq.true&select=id&limit=1", "Adresse");
  gleich((a.aufrufe[0].init.headers as Record<string, string>).apikey, "geheim-test", "Schluessel");
  gleich(!!a.aufrufe[0].init.signal, true, "Zeitlimit gesetzt");
});

Deno.test("kein aktiver Zugang: false", async () => {
  gleich(await fetchLiveAktiv("HU001", attrappe(200, "[]").abruf), false, "leer");
});

Deno.test("Fehler, falsche Antwort, Netz weg: false, wirft nie", async () => {
  gleich(await fetchLiveAktiv("V002", attrappe(500, "x").abruf), false, "500");
  gleich(await fetchLiveAktiv("V002", attrappe(200, "kein json").abruf), false, "kein JSON");
  gleich(await fetchLiveAktiv("V002", attrappe(200, '{"id":1}').abruf), false, "kein Array");
  gleich(await fetchLiveAktiv("V002", attrappe(0, new Error("Zeitlimit")).abruf), false, "Netz weg");
});

Deno.test("ungueltige Kunden-ID: gar keine Abfrage", async () => {
  for (const id of ["", "v002", "V002&aktiv=eq.false", "../x", "ABCDE1"]) {
    const a = attrappe(200, '[{"id":"x"}]');
    gleich(await fetchLiveAktiv(id, a.abruf), false, id);
    gleich(a.aufrufe.length, 0, "kein Abruf bei " + id);
  }
});
