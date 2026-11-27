// Tests ohne Netz fuer das Sport-Symbol (lib/sportart.ts, Zweig sport-symbol).
// Ausfuehren: deno test --no-lock --allow-env netlify/edge-functions/lib/sportart.test.ts
import { sportAnzeige } from "./sportart.ts";
import { fetchSupabaseBranding } from "./supabaseBranding.ts";
import { filterBranding } from "./brandingFilter.ts";

Deno.env.set("SUPABASE_URL", "https://beispiel.supabase.co");
Deno.env.set("SUPABASE_ANON_KEY", "anon-test");

function gleich(ist: unknown, soll: unknown, was: string) {
  if (JSON.stringify(ist) !== JSON.stringify(soll)) {
    throw new Error(`${was}: erwartet ${JSON.stringify(soll)}, bekommen ${JSON.stringify(ist)}`);
  }
}

Deno.test("Regel: Fussball, Basketball, leer, andere", () => {
  gleich(sportAnzeige(["Fußball"]), "fussball", "Fußball (V014)");
  gleich(sportAnzeige(["Basketball", "Handball"]), "basketball", "V007");
  gleich(sportAnzeige([]), "basketball", "leer = Basketball");
  gleich(sportAnzeige(undefined), "basketball", "fehlt = Basketball");
  gleich(sportAnzeige(["Handball"]), "neutral", "nur Handball");
});

Deno.test("Branding: Sportart kommt durch den Filter an die App", async () => {
  const echtesFetch = globalThis.fetch;
  let zeile: Record<string, unknown> = { kunden_id: "V014", verein_name: "SV Demo", sportarten: ["Fußball"] };
  globalThis.fetch = (() => Promise.resolve(new Response(JSON.stringify([zeile]), { status: 200 }))) as typeof fetch;
  try {
    let b = filterBranding(await fetchSupabaseBranding("V014"));
    gleich(b?.Sportart, "fussball", "V014");
    zeile = { kunden_id: "V002", verein_name: "Scorpions", sportarten: [] };
    b = filterBranding(await fetchSupabaseBranding("V002"));
    gleich(b?.Sportart, "basketball", "V002 leer");
  } finally {
    globalThis.fetch = echtesFetch;
  }
});
