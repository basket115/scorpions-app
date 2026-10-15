// Tests ohne Netz fuer die Regeln in supabaseAbruf.ts.
// Ausfuehren: deno test netlify/edge-functions/lib/supabaseAbruf.test.ts
import {
  abrufMitWiederholung,
  brandingVollstaendig,
  FEHLER_NICHT_GEFUNDEN,
  FEHLER_SUPABASE,
  leseFehler,
} from "./supabaseAbruf.ts";

function gleich(ist: unknown, soll: unknown, was: string) {
  if (JSON.stringify(ist) !== JSON.stringify(soll)) {
    throw new Error(`${was}: erwartet ${JSON.stringify(soll)}, bekommen ${JSON.stringify(ist)}`);
  }
}

// Abruf-Attrappe: wirft bzw. antwortet der Reihe nach wie vorgegeben.
function attrappe(ablauf: ("fehler" | number)[]) {
  let aufrufe = 0;
  const abruf = (_url: string, init: RequestInit) => {
    const schritt = ablauf[aufrufe++];
    if (!init.signal) throw new Error("kein Zeitlimit gesetzt");
    if (schritt === "fehler") return Promise.reject(new Error("Zeitlimit"));
    return Promise.resolve(new Response("[]", { status: schritt }));
  };
  return { abruf, aufrufe: () => aufrufe };
}

Deno.test("erster Versuch klappt: kein zweiter Versuch", async () => {
  const a = attrappe([200]);
  const antwort = await abrufMitWiederholung("u", {}, "[Test]", a.abruf);
  gleich(antwort.status, 200, "Status");
  gleich(a.aufrufe(), 1, "Versuche");
});

Deno.test("Zeitlimit beim ersten Versuch: genau ein zweiter Versuch", async () => {
  const a = attrappe(["fehler", 200]);
  const antwort = await abrufMitWiederholung("u", {}, "[Test]", a.abruf);
  gleich(antwort.status, 200, "Status");
  gleich(a.aufrufe(), 2, "Versuche");
});

Deno.test("beide Versuche scheitern: Fehler, kein dritter Versuch", async () => {
  const a = attrappe(["fehler", "fehler", 200]);
  let geworfen = false;
  try {
    await abrufMitWiederholung("u", {}, "[Test]", a.abruf);
  } catch {
    geworfen = true;
  }
  gleich(geworfen, true, "Fehler geworfen");
  gleich(a.aufrufe(), 2, "Versuche");
});

Deno.test("Fehlerstatus von Supabase (500) wird nicht wiederholt", async () => {
  const a = attrappe([500, 200]);
  const antwort = await abrufMitWiederholung("u", {}, "[Test]", a.abruf);
  gleich(antwort.status, 500, "Status");
  gleich(a.aufrufe(), 1, "Versuche");
});

Deno.test("leseFehler: unbekannter Kunde = 404 Kunde nicht gefunden", () => {
  gleich(leseFehler(false, [{}]), { status: 404, error: FEHLER_NICHT_GEFUNDEN }, "unbekannt");
  gleich(leseFehler(false, [null]), { status: 404, error: FEHLER_NICHT_GEFUNDEN }, "unbekannt + Fehler");
});

Deno.test("leseFehler: technischer Fehler = 503, nie Erfolg", () => {
  gleich(leseFehler(null, [{}]), { status: 503, error: FEHLER_SUPABASE }, "Kundenpruefung gescheitert");
  gleich(leseFehler(true, [{}, null, []]), { status: 503, error: FEHLER_SUPABASE }, "ein Teil gescheitert");
});

Deno.test("leseFehler: alles da = kein Fehler (auch leere Listen und false)", () => {
  gleich(leseFehler(true, [{ Verein_Name: "X" }, [], []]), null, "leere Listen");
  gleich(leseFehler(true, [false]), null, "hasTeamLogin false");
});

Deno.test("Branding ohne Vereinsnamen gilt nie als vollstaendig", () => {
  gleich(brandingVollstaendig(null), false, "null");
  gleich(brandingVollstaendig({}), false, "leer");
  gleich(brandingVollstaendig({ Verein_Name: "  " }), false, "nur Leerzeichen");
  gleich(brandingVollstaendig({ Verein_Name: "SV Schlossberg" }), true, "mit Name");
});
