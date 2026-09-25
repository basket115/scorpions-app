import type { Context } from "https://edge.netlify.com";
import { fetchSupabaseBranding, istSupabaseKunde } from "./lib/supabaseBranding.ts";
import { ladeBildInfo } from "./lib/bildInfo.ts";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzrvPIQsGaqHP28_9G-geahMB0QMYHlbylnGLUTeJagi1Sc_rgPVErasrhc0HGGthppYA/exec";

const STANDARD_NAME = "ONLANG";
const STANDARD_FARBE = "#111111";
const STANDARD_LOGO = "/logo.png";

// Herkunft der Manifest-Daten, steht im Header X-Onlang-Quelle.
type Quelle = "supabase" | "gas" | "fallback";

type ManifestBranding = {
  vereinName: string;
  kurzName: string;
  themaFarbe: string;
  logoUrl: string;
  appIcon192: string;
  appIcon512: string;
};

type ManifestIcon = { src: string; sizes?: string; type?: string; purpose: string };

// Uebernimmt Name, Farbe und Logo aus einem Branding-Objekt (GAS- bzw.
// aus Supabase uebersetzte Feldnamen). Leere Werte -> Standard.
// Short_Name und App_Icon_* gibt es nur in Supabase.
function brandingUebernehmen(branding: Record<string, unknown>): ManifestBranding {
  const vereinName = String(branding.Verein_Name || STANDARD_NAME).trim() || STANDARD_NAME;
  return {
    vereinName,
    kurzName: String(branding.Short_Name || "").trim() || vereinName,
    themaFarbe: String(branding.Thema_Farbe || STANDARD_FARBE).trim() || STANDARD_FARBE,
    logoUrl: String(
      branding.Logo_Verein ||
      branding.Logo_verein ||
      branding.Logo ||
      STANDARD_LOGO
    ).trim() || STANDARD_LOGO,
    appIcon192: String(branding.App_Icon_192 || "").trim(),
    appIcon512: String(branding.App_Icon_512 || "").trim(),
  };
}

// MIME-Typ aus der Dateiendung (fuer die eigenen App-Icons, deren Groesse
// per Spalte feststeht). Unbekannt -> kein type, der Browser erkennt ihn.
function typAusEndung(src: string): string | undefined {
  const pfad = src.split("?")[0].toLowerCase();
  if (pfad.endsWith(".png")) return "image/png";
  if (pfad.endsWith(".jpg") || pfad.endsWith(".jpeg")) return "image/jpeg";
  if (pfad.endsWith(".webp")) return "image/webp";
  return undefined;
}

// purpose nur "any": die Icons haben keinen Schutzrand fuer "maskable",
// Android wuerde sie anschneiden.
async function iconsErmitteln(branding: ManifestBranding, requestUrl: string): Promise<ManifestIcon[]> {
  // 1) Eigene, quadratische App-Icons (Spalten app_icon_192/app_icon_512).
  const eigene: ManifestIcon[] = [];
  if (branding.appIcon192) {
    eigene.push({ src: branding.appIcon192, sizes: "192x192", type: typAusEndung(branding.appIcon192), purpose: "any" });
  }
  if (branding.appIcon512) {
    eigene.push({ src: branding.appIcon512, sizes: "512x512", type: typAusEndung(branding.appIcon512), purpose: "any" });
  }
  if (eigene.length) return eigene;

  // 2) Sonst das Vereinslogo mit seinen tatsaechlichen Massen und seinem
  //    tatsaechlichen Format (z. B. JPEG statt behauptetem PNG).
  const info = await ladeBildInfo(new URL(branding.logoUrl, requestUrl).toString());
  if (info) {
    return [{ src: branding.logoUrl, sizes: `${info.width}x${info.height}`, type: info.type, purpose: "any" }];
  }
  // Nicht lesbar: lieber keine als falsche Angaben.
  return [{ src: branding.logoUrl, purpose: "any" }];
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
    kurzName: STANDARD_NAME,
    themaFarbe: STANDARD_FARBE,
    logoUrl: STANDARD_LOGO,
    appIcon192: "",
    appIcon512: "",
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

  const manifest = {
    id: appId,
    short_name: branding.kurzName,
    name: `${branding.vereinName} Vereins-App`,
    start_url: startUrl,
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: branding.themaFarbe,
    icons: await iconsErmitteln(branding, request.url)
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
