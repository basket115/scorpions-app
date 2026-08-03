// src/utils/feed.ts
import { apiGet } from './api';
import { resolveCustomerId } from './customer';

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
  content?: string;
  imageUrl?: string;
  createdAt?: string;
  datum?: string;
  kategorie?: string;
  clubId?: string;
  deleted?: boolean;
};

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

const DE_DATE = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit", month: "2-digit", year: "numeric"
});

function formatDate(d: Date): string {
  return DE_DATE.format(d);
}

// ✅ Robuster Datum-Parser — versteht alle Formate
export function parseDate(input: unknown): Date | null {
  if (input === null || input === undefined) return null;

  if (typeof input === "number" && Number.isFinite(input)) {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // DD.MM.YYYY oder D.M.YYYY mit optionaler Uhrzeit (z.B. "16.3.2026, 13:08:05")
    const m = trimmed.match(
      /^(\d{1,2})\.(\d{1,2})\.(\d{3,4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
    );
    if (m) {
      const dd = Number(m[1]);
      const mm = Number(m[2]);
      let yyyy = Number(m[3]);
      if (yyyy < 1000) yyyy = 2000 + yyyy;
      const hh = m[4] ? Number(m[4]) : 0;
      const min = m[5] ? Number(m[5]) : 0;
      const sec = m[6] ? Number(m[6]) : 0;
      const d = new Date(yyyy, mm - 1, dd, hh, min, sec, 0);
      return isNaN(d.getTime()) ? null : d;
    }

    // ISO-String und alle anderen Formate
    const d = new Date(trimmed);
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
  const dateRaw = row?.date || row?.Datum || row?.createdAt;
  const date = parseDate(dateRaw);

  // ✅ Datum immer als DD.MM.YYYY formatieren
  const dateLabel = (() => {
    if (date) return formatDate(date);
    const raw = cleanStr(row?.Datum || row?.date);
    if (!raw) return undefined;
    const fallback = new Date(raw);
    if (!isNaN(fallback.getTime())) return formatDate(fallback);
    return raw;
  })();

  const deleted =
    String(row?.['Gelöscht'] || row?.deleted || '').toUpperCase() === 'JA' ||
    row?.deleted === true;

  return {
    id: cleanStr(row?.id || row?.ID) ?? crypto.randomUUID(),
    kind: toKind(row),
    title: cleanStr(row?.title || row?.Titel),
    text: cleanStr(row?.text || row?.Text || row?.Inhalt),
    image: cleanStr(row?.heroImageUrl || row?.image || row?.Bild_URL || row?.imageUrl),
    linkUrl: cleanStr(row?.linkUrl || row?.Video_URL),
    linkLabel: cleanStr(row?.linkLabel),
    dateRaw,
    date,
    dateLabel,
    home: cleanStr(row?.home),
    away: cleanStr(row?.away),
    homeScore: cleanNum(row?.homeScore),
    awayScore: cleanNum(row?.awayScore),
    webUrl: cleanStr(row?.WEB_URL || row?.webUrl),
    facebookUrl: cleanStr(row?.Facebook_URL || row?.facebookUrl),
    instagramUrl: cleanStr(row?.Instragram_URL || row?.Instagram_URL || row?.instagramUrl),
    youtubeUrl: cleanStr(row?.Youtube_URL || row?.youtubeUrl),
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

export async function fetchFeed(): Promise<FeedRow[]> {
  // Kunden-ID zentral, kein V002-Fallback mehr. Zugriff nur ueber den Proxy.
  if (!resolveCustomerId()) throw new Error('Keine gueltige Kunden-ID');

  const json = await apiGet('get_beitraege');
  if (!json.success) throw new Error(json.error || 'API Fehler');

  const data = Array.isArray(json.rows) ? json.rows
    : Array.isArray(json.data) ? json.data
    : Array.isArray(json.beitraege) ? json.beitraege
    : [];

  return data
    .map(normalizeRow)
    .filter((item: FeedRow) => !item.deleted)
    // ✅ Neueste Beiträge zuerst
    .sort((a: FeedRow, b: FeedRow) => {
      const at = a.date ? a.date.getTime() : 0;
      const bt = b.date ? b.date.getTime() : 0;
      return bt - at;
    });
}

export const loadFeed = fetchFeed;
