import type { Context } from "https://edge.netlify.com";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzrvPIQsGaqHP28_9G-geahMB0QMYHlbylnGLUTeJagi1Sc_rgPVErasrhc0HGGthppYA/exec";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const kundenId = (url.searchParams.get("kunde") || "").trim();

  let vereinName = "ONLANG";
  let themaFarbe = "#111111";
  let logoUrl = "/logo.png";

  if (kundenId) {
    try {
      const targetUrl = `${SCRIPT_URL}?action=get_bootstrap&kundenId=${encodeURIComponent(kundenId)}`;
      const response = await fetch(targetUrl, {
        method: "GET",
        redirect: "follow",
        cache: "no-store",
        headers: { "User-Agent": "Netlify-Edge-PWA-Manifest/1.0" },
      });

      const data = await response.json();
      const branding = data?.branding || {};

      if (data?.success && branding) {
        vereinName = String(branding.Verein_Name || "ONLANG").trim() || "ONLANG";
        themaFarbe = String(branding.Thema_Farbe || "#111111").trim() || "#111111";
        logoUrl = String(
          branding.Logo_Verein ||
          branding.Logo_verein ||
          branding.Logo ||
          "/logo.png"
        ).trim() || "/logo.png";
      }
    } catch (error) {
      console.error("[PWA manifest] Branding konnte nicht geladen werden", error);
    }
  }

const startUrl = kundenId ? `/?kunde=${encodeURIComponent(kundenId)}` : "/";
const appId = kundenId ? `/app/${encodeURIComponent(kundenId)}` : "/app/onlang";

const manifest = {
  id: appId,
    short_name: vereinName,
    name: `${vereinName} Vereins-App`,
    start_url: startUrl,
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: themaFarbe,
    icons: [
      { src: logoUrl, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: logoUrl, sizes: "512x512", type: "image/png", purpose: "any maskable" }
    ]
  };

  return new Response(JSON.stringify(manifest), {
    status: 200,
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
      "Access-Control-Allow-Origin": "*"
    }
  });
};

export const config = { path: "/manifest.webmanifest" };
