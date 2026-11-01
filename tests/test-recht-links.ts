// Tests fuer die Links zu Impressum und Datenschutz im Fuss der App.
// Ohne Datenbank. Aufruf: deno test --no-lock -A tests/test-recht-links.ts

import { rechtLinksAus, rechtstextFertig } from "../netlify/edge-functions/lib/supabaseBranding.ts";

function gleich(ist: unknown, soll: unknown, was: string) {
  if (JSON.stringify(ist) !== JSON.stringify(soll)) {
    throw new Error(`${was}: erwartet ${JSON.stringify(soll)}, bekommen ${JSON.stringify(ist)}`);
  }
}

Deno.test("Fertig: echte Angaben", () => {
  gleich(rechtstextFertig("Beispiel e.V.\nRegistergericht: Amtsgericht Neuss\nWir speichern Ihre E-Mail-Adresse."), true, "fertig");
});

Deno.test("Nicht fertig: leer und Vorlagen-Zeilen", () => {
  for (const z of ["", "  ", "[[Vereinsname]]", "ENTWURF: x", "TERVEZET: x", "Draft: x", "Vereinsname", "Name(n) des Vorstands", "Registergericht: Amtsgericht", "E-Mail: E-Mail-Adresse", "Az egyesület neve", "Phone: phone number"]) {
    gleich(rechtstextFertig(z), false, z);
  }
});

Deno.test("Links: Text geht vor Link, Vorlage zaehlt nicht, nur https", () => {
  const seite = (s: string) => `https://app.onlang.de/verein-recht.html?kunde=V002&seite=${s}`;
  gleich(rechtLinksAus("V002", undefined), {}, "keine Zeile");
  gleich(rechtLinksAus("V002", { impressum_text: "Beispiel e.V.", impressum_url: "https://x.de/i" }), { Impressum_Link: seite("impressum") }, "Text vor Link");
  gleich(rechtLinksAus("V002", { impressum_text: "Vereinsname", impressum_url: "https://x.de/i" }), { Impressum_Link: "https://x.de/i" }, "unfertig: alter Link");
  gleich(rechtLinksAus("V002", { datenschutz_text: "[[offen]]" }), {}, "unfertig ohne Link");
  gleich(rechtLinksAus("V002", { datenschutz_url: "http://x.de/d" }), {}, "kein https");
  gleich(rechtLinksAus("V002", { datenschutz_url: "javascript:alert(1)" }), {}, "kein Skript");
});
