const API_BASE =
  "https://script.google.com/macros/s/AKfycbyUP8wHkErf7a20HJemThwY4Vq0xjQiCskpXDWwqysG2y3BCKMulLTRZ7-Fs0LbFoBacg/exec";

export type FeedItem = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt?: string;
  clubId?: string;
  deleted?: boolean;
};

function getKundenId(): string {
  const appName = import.meta.env.VITE_APP_NAME;

  if (appName === "Scorpions") return "V002";
  if (appName === "TG Neuss") return "V004";
  if (appName === "BBK") return "V006";

  throw new Error("Keine kundenId für diese App definiert");
}

export async function loadFeed(): Promise<FeedItem[]> {
  const kundenId = getKundenId();

  const url = new URL(API_BASE);
  url.searchParams.set("action", "get_beitraege");
  url.searchParams.set("kundenId", kundenId);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`HTTP Fehler ${res.status}`);
  }

  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error || "API Fehler");
  }

  const data = Array.isArray(json.data) ? json.data : [];

  return data
    .map((item: any) => ({
      id: item.ID || crypto.randomUUID(),
      title: item.Titel || "Ohne Titel",
      content: item.Inhalt || "",
      imageUrl: item.Bild_URL || "",
      createdAt: item.Erstellt_Am || item.Datum || "",
      clubId: item.KundenID || item.Verein_ID || "",
      deleted: String(item.Gelöscht || "").toUpperCase() === "JA",
    }))
    .filter((item: FeedItem) => !item.deleted);
}
