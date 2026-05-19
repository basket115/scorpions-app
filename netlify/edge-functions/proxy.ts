import type { Context } from "https://edge.netlify.com";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzrvPIQsGaqHP28_9G-geahMB0QMYHlbylnGLUTeJagi1Sc_rgPVErasrhc0HGGthppYA/exec";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const params = url.searchParams.toString();
  const targetUrl = `${SCRIPT_URL}${params ? '?' + params : ''}`;

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: { "User-Agent": "Netlify-Edge-Proxy/1.0" },
      redirect: "follow",
    });
    const data = await response.text();
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Proxy Fehler" }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }}
    );
  }
};

export const config = { path: "/api/proxy" };
