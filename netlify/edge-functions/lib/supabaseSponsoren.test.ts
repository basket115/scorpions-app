// Tests ohne Netz: Partner fuer die App liefern auch Beschreibung und Website
// (Zweig app-schrift, 27.11.2026 – V014 zeigte nur das Logo).
// Ausfuehren: deno test --no-lock --allow-env netlify/edge-functions/lib/supabaseSponsoren.test.ts
import { fetchSupabaseSponsoren } from "./supabaseSponsoren.ts";

Deno.env.set("SUPABASE_URL", "https://beispiel.supabase.co");
Deno.env.set("SUPABASE_ANON_KEY", "anon-test");

function gleich(ist: unknown, soll: unknown, was: string) {
  if (JSON.stringify(ist) !== JSON.stringify(soll)) {
    throw new Error(`${was}: erwartet ${JSON.stringify(soll)}, bekommen ${JSON.stringify(ist)}`);
  }
}

Deno.test("Partner: Beschreibung und Website kommen an, Slot-Zeilen nicht", async () => {
  const echtesFetch = globalThis.fetch;
  const zeilen = [
    { id: 58, kunden_id: "V014", partner_name: "VT-Projektbau", slot: "HERO_RIGHT", aktiv: true, sponsor_level: "hervorgehoben" },
    { id: 59, kunden_id: "V014", partner_name: "VT-Projektbau", slot: null, aktiv: true, sponsor_level: "hervorgehoben",
      logo_url: "https://res.cloudinary.com/x/logo.png", beschreibung: "Planungsbüro", website: "https://vt-projektbau.de" },
  ];
  globalThis.fetch = (() => Promise.resolve(new Response(JSON.stringify(zeilen), { status: 200 }))) as typeof fetch;
  try {
    const liste = (await fetchSupabaseSponsoren("V014")) as Record<string, unknown>[];
    gleich(liste.length, 1, "nur die Zeile ohne Slot");
    gleich(liste[0].Beschreibung, "Planungsbüro", "Beschreibung");
    gleich(liste[0].Website, "https://vt-projektbau.de", "Website");
    gleich(liste[0].Logo_URL, "https://res.cloudinary.com/x/logo.png", "Logo");
  } finally {
    globalThis.fetch = echtesFetch;
  }
});
