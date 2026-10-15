import type { Context } from "https://edge.netlify.com";
import { fetchSupabaseBranding, istSupabaseKunde } from "./lib/supabaseBranding.ts";
import { ladeBildInfo } from "./lib/bildInfo.ts";
import { brandingVollstaendig } from "./lib/supabaseAbruf.ts";

// Name, Farbe und Logo kommen nur aus Supabase (kein GAS-Rueckfall mehr).
// Unbekannter Kunde oder Supabase nicht erreichbar: ONLANG-Standard.
const STANDARD_NAME = "ONLANG";
const STANDARD_FARBE = "#111111";
const STANDARD_LOGO = "/logo.png";

// Herkunft der Manifest-Daten, steht im Header X-Onlang-Quelle.
type Quelle = "supabase" | "fallback";

type ManifestBranding = {
  vereinName: string;
  kurzName: string;
  themaFarbe: string;
  logoUrl: string;
  appIcon192: string;
  appIcon512: string;
};

type ManifestIcon = { src: string; sizes?: string; type?: string; purpose: string };

// Uebernimmt Name, Farbe und Logo aus dem Supabase-Branding (uebersetzte
// Feldnamen). Leere Werte -> Standard.
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

    if (imSupabase === true && brandingVollstaendig(supabaseBranding)) {
      branding = brandingUebernehmen(supabaseBranding!);
      quelle = "supabase";
    } else {
      console.error("[PWA manifest] Kein Branding aus Supabase, ONLANG-Standard", kundenId, imSupabase);
    }
  }

  // Ohne Verein kein start_url und keine id (undefined faellt im JSON weg):
  // dann gilt die gerade geoeffnete Adresse als Startadresse, statt "/"
  // ohne Verein.
  const startUrl = kundenId ? `/?kunde=${encodeURIComponent(kundenId)}` : undefined;
  const appId = kundenId ? `/app/${encodeURIComponent(kundenId)}` : undefined;

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
