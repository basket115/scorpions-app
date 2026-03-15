// src/utils/feed.ts
const API_BASE =
  "https://script.google.com/macros/s/AKfycbwm0nO0XRsJD2gqWTbfZvRHdKTN0ylbJrWkJt66TcCCiBkX8l7aaV2lF5saHEBwwqeUoA/exec";

export type FeedKind = "news" | "result" | "training" | "unknown";

export type FeedRow = {
  id: string;
  kind: FeedKind;
  title?: string;
  text?: string;
  image?: string;
  linkUrl?: string;
  linkLabel?: string;
  dateRaw?: string | number;
  date?: Date | null;
  dateLabel?: string;
  home?: string;
  away?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  teams?: string[];
  competition?: string;
  venue?: string;
  highlights?: string;
  trainingType?: string;
  durationMin?: number | null;
  intensity?: string;
  webUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  tiktokUrl?: string;
  // Extra fields from admin sheet
  content?: string;
  imageUrl?: string;
  createdAt?: string;
  datum?: string;
  kategorie?: string;
  clubId?: string;
  deleted?: boolean;
};

// Alias
export type FeedItem = FeedRow;

function cleanStr(v: any): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}

function cleanNum(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function parseDate(input: unknown): Date | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") return new Date(input);
  if (typeof input === "string") {
    const d = new Date(input.trim());
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function toKind(row: any): FeedKind {
  const raw = String(row?.kind || row?.type || row?.Kategorie || "").toLowerCase();
  if (raw.includes("result") || raw.includes("ergebnis")) return "result";
  if (raw.includes("training")) return "training";
  if (raw.includes("news") || raw.includes("unknown")) return "news";
  return "news";
}

function normalizeRow(row: any): FeedRow {
  const date = parseDate(row?.date || row?.Datum || row?.createdAt);
  const deleted =
    String(row?.['Gelöscht'] || row?.deleted || '').toUpperCase() === 'JA' ||
    row?.deleted === true;

  return {
    id: cleanStr(row?.id || row?.ID) ?? crypto.randomUUID(),
    kind: toKind(row),
    title: cleanStr(row?.title || row?.Titel),
    text: cleanStr(row?.text || row?.Text || row?.Inhalt),
    image: cleanStr(row?.heroImageUrl || row?.image || row?.Bild_URL || row?.imageUrl),
    linkUrl: cleanStr(row?.linkUrl),
    linkLabel: cleanStr(row?.linkLabel),
    date,
    dateLabel: date
      ? new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date)
      : cleanStr(row?.Datum),
    home: cleanStr(row?.home),
    away: cleanStr(row?.away),
    homeScore: cleanNum(row?.homeScore),
    awayScore: cleanNum(row?.awayScore),
    webUrl: cleanStr(row?.WEB_URL || row?.webUrl),
    facebookUrl: cleanStr(row?.Facebook_URL || row?.facebookUrl),
    instagramUrl: cleanStr(row?.Instragram_URL || row?.Instagram_URL || row?.instagramUrl),
    youtubeUrl: cleanStr(row?.Youtube_URL || row?.Video_URL || row?.youtubeUrl),
    tiktokUrl: cleanStr(row?.TikTok_URL || row?.tiktokUrl),
    content: cleanStr(row?.Text || row?.Inhalt || row?.content),
    imageUrl: cleanStr(row?.Bild_URL || row?.imageUrl),
    createdAt: cleanStr(row?.date || row?.Erstellt_Am),
    datum: cleanStr(row?.Datum),
    kategorie: cleanStr(row?.Kategorie),
    clubId: cleanStr(row?.Kunden_ID || row?.KundenID),
    deleted,
  };
}

function getKundenId(): string {
  // URL Parameter
  const params = new URLSearchParams(window.location.search);
  const kunde = params.get('kunde');
  if (kunde) return kunde;
  // Default Scorpions
  return 'V002';
}

export async function fetchFeed(): Promise<FeedRow[]> {
  const kundenId = getKundenId();
  const url = new URL(API_BASE);
  url.searchParams.set('action', 'get_beitraege');
  url.searchParams.set('kundenId', kundenId);

  const res = await fetch(url.toString(), { method: 'GET', redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP Fehler ${res.status}`);

  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'API Fehler');

  const data = Array.isArray(json.rows) ? json.rows
    : Array.isArray(json.data) ? json.data
    : Array.isArray(json.beitraege) ? json.beitraege
    : [];

  return data
    .map(normalizeRow)
    .filter((item: FeedRow) => !item.deleted);
}

// Alias
export const loadFeed = fetchFeed;
