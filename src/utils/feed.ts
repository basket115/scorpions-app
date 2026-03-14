// src/utils/feed.ts
const API_BASE =
  "https://script.google.com/macros/s/AKfycbwm0nO0XRsJD2gqWTbfZvRHdKTN0ylbJrWkJt66TcCCiBkX8l7aaV2lF5saHEBwwqeUoA/exec";

export type FeedRow = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt?: string;
  datum?: string;
  kategorie?: string;
  clubId?: string;
  deleted?: boolean;
};

// Alias für Rückwärtskompatibilität
export type FeedItem = FeedRow;

function getKundenId(): string {
  const appName = (import.meta as any).env?.VITE_APP_NAME;
  if (appName === 'Scorpions') return 'V002';
  if (appName === 'TG Neuss') return 'V004';
  if (appName === 'BBK') return 'V006';
  // Fallback: aus URL lesen
  const params = new URLSearchParams(window.location.search);
  const kunde = params.get('kunde');
  if (kunde) return kunde;
  return 'V002'; // Default Scorpions
}

export async function fetchFeed(): Promise<FeedRow[]> {
  const kundenId = getKundenId();
  const url = new URL(API_BASE);
  url.searchParams.set('action', 'get_beitraege');
  url.searchParams.set('kundenId', kundenId);

  const res = await fetch(url.toString(), { method: 'GET', headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP Fehler ${res.status}`);

  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'API Fehler');

  // API gibt { success, ok, count, rows } zurück
  const data = Array.isArray(json.rows) ? json.rows
    : Array.isArray(json.data) ? json.data
    : Array.isArray(json.beitraege) ? json.beitraege
    : [];

  return data
    .map((item: any) => ({
      id: String(item.id || item.ID || crypto.randomUUID()),
      title: item.Titel || item.title || 'Ohne Titel',
      content: item.Text || item.Inhalt || item.content || '',
      imageUrl: item.Bild_URL || item.imageUrl || '',
      videoUrl: item.Video_URL || item.videoUrl || '',
      createdAt: item.Erstellt_Am || item.date || '',
      datum: item.Datum || item.datum || '',
      kategorie: item.Kategorie || item.kategorie || '',
      clubId: item.Kunden_ID || item.KundenID || '',
      deleted: String(item['Gelöscht'] || item.deleted || '').toUpperCase() === 'JA',
    }))
    .filter((item: FeedRow) => !item.deleted);
}

// Alias für alte Importe
export const loadFeed = fetchFeed;
