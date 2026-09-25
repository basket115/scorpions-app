import type { Context } from "https://edge.netlify.com";
import { fetchSupabaseBranding, istSupabaseKunde } from "./lib/supabaseBranding.ts";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzrvPIQsGaqHP28_9G-geahMB0QMYHlbylnGLUTeJagi1Sc_rgPVErasrhc0HGGthppYA/exec";

const STANDARD_NAME = "ONLANG";
const STANDARD_FARBE = "#111111";
const STANDARD_LOGO = "/logo.png";

// Herkunft der Manifest-Daten, steht im Header X-Onlang-Quelle.
type Quelle = "supabase" | "gas" | "fallback";

type ManifestBranding = { vereinName: string; themaFarbe: string; logoUrl: string };

// Uebernimmt Name, Farbe und Logo aus einem Branding-Objekt (GAS- bzw.
// aus Supabase uebersetzte Feldnamen). Leere Werte -> Standard.
function brandingUebernehmen(branding: Record<string, unknown>): ManifestBranding {
  return {
    vereinName: String(branding.Verein_Name || STANDARD_NAME).trim() || STANDARD_NAME,
    themaFarbe: String(branding.Thema_Farbe || STANDARD_FARBE).trim() || STANDARD_FARBE,
    logoUrl: String(
      branding.Logo_Verein ||
      branding.Logo_verein ||
      branding.Logo ||
      STANDARD_LOGO
    ).trim() || STANDARD_LOGO,
  };
}

// GAS nur fuer Nicht-Supabase-Kunden bzw. bei technischem Supabase-Fehler.
// Mit Timeout, und eine HTML-Fehlerseite statt JSON fuehrt zu null statt
// zu einer Ausnahme.
async function brandingAusGas(kundenId: string): Promise<ManifestBranding | null> {
  try {
    const targetUrl = `${SCRIPT_URL}?action=get_bootstrap&kundenId=${encodeURIComponent(kundenId)}`;
    const response = await fetch(targetUrl, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: { "User-Agent": "Netlify-Edge-PWA-Manifest/1.0" },
      signal: AbortSignal.timeout(6000),
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error("[PWA manifest] GAS-Antwort nicht als JSON lesbar", parseError);
      return null;
    }

    if (data?.success && data.branding && typeof data.branding === "object") {
      return brandingUebernehmen(data.branding);
    }
    return null;
  } catch (error) {
    console.error("[PWA manifest] Branding aus GAS konnte nicht geladen werden", error);
    return null;
  }
}

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const kundenId = (url.searchParams.get("kunde") || "").trim();

  let branding: ManifestBranding = {
    vereinName: STANDARD_NAME,
    themaFarbe: STANDARD_FARBE,
    logoUrl: STANDARD_LOGO,
  };
  let quelle: Quelle = "fallback";

  if (kundenId) {
    const [imSupabase, supabaseBranding] = await Promise.all([
      istSupabaseKunde(kundenId),
      fetchSupabaseBranding(kundenId),
    ]);

    if (imSupabase === true && supabaseBranding) {
      // Supabase-Kunde: nur Supabase, kein GAS-Aufruf.
      branding = brandingUebernehmen(supabaseBranding);
      quelle = "supabase";
    } else {
      // Kein Supabase-Kunde oder technischer Fehler: GAS wie bisher.
      const gasBranding = await brandingAusGas(kundenId);
      if (gasBranding) {
        branding = gasBranding;
        quelle = "gas";
      }
    }
  }

  const startUrl = kundenId ? `/?kunde=${encodeURIComponent(kundenId)}` : "/";
  const appId = kundenId ? `/app/${encodeURIComponent(kundenId)}` : "/app/onlang";

  // purpose nur "any": die Vereinslogos haben keinen Schutzrand, "maskable"
  // wuerde sie auf Android anschneiden.
  const manifest = {
    id: appId,
    short_name: branding.vereinName,
    name: `${branding.vereinName} Vereins-App`,
    start_url: startUrl,
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: branding.themaFarbe,
    icons: [
      { src: branding.logoUrl, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: branding.logoUrl, sizes: "512x512", type: "image/png", purpose: "any" }
    ]
  };

  return new Response(JSON.stringify(manifest), {
    status: 200,
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Expose-Headers": "X-Onlang-Quelle",
      "X-Onlang-Quelle": quelle
    }
  });
};

export const config = { path: "/manifest.webmanifest" };
