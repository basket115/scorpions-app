// src/utils/feed.ts

export type FeedKind = "news" | "result" | "training" | "unknown";

export type ApiResponse = {
  success?: boolean;
  ok?: boolean;
  count?: number;
  rows?: any[];
  data?: any[];
};

export type FeedRow = {
  id: string;
  type?: string;
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

  teamIds?: string;
  teams?: string[];
  competition?: string;
  venue?: string;
  highlights?: string;

  trainingType?: string;
  durationMin?: number | null;
  intensity?: string;

  category?: string;
};

const API_BASE =
  "HIER_DEINE_APPS_SCRIPT_WEBAPP_URL_EINFUEGEN";

// Für Scorpions erstmal V004.
// Falls nötig später nur diese eine Zeile ändern.
const KUNDEN_ID = "V002";

function buildUrl(action: string, kundenId: string): string {
  const url = new URL(API_BASE);
  url.searchParams.set("action", action);
  url.searchParams.set("kundenId", kundenId);
  return url.toString();
}

function cleanStr(v: any): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}

function cleanNum(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeTeamLabel(raw: string): string {
  let s = raw.trim().replace(/\s+/g, " ");
  if (!s) return s;

  const known: Array<[RegExp, string]> = [
    [/^damen$/i, "Damen"],
    [/^(männliche|maennliche)\s*u18$/i, "Männliche U18"],
    [/^(männliche|maennliche)\s*u16$/i, "Männliche U16"],
    [/^(männliche|maennliche)\s*u16\/2$/i, "Männliche U16/2"],
    [/^(männliche|maennliche)\s*u16\s*\/\s*2$/i, "Männliche U16/2"],
    [/^(weibliche)\s*u16$/i, "Weibliche U16"],
    [/^u14\s*offen$/i, "U14 offen"],
    [/^u12\s*offen$/i, "U12 offen"],
    [/^basketball$/i, "Basketball"],
    [/^vorstand$/i, "Vorstand"],
  ];

  for (const [rx, label] of known) {
    if (rx.test(s)) return label;
  }

  s = s.replace(/\bu(\d{1,2})\b/gi, (_m, num) => `U${num}`);
  s = s.charAt(0).toUpperCase() + s.slice(1);

  if (/^(männliche|maennliche)/i.test(s)) {
    s = s.replace(/^(männliche|maennliche)/i, "Männliche");
  }
  if (/^weibliche/i.test(s)) {
    s = s.replace(/^weibliche/i, "Weibliche");
  }
  s = s.replace(/\bOffen\b/g, "offen");

  return s;
}

function parseTeams(teamIds: any): string[] {
  const s = cleanStr(teamIds);
  if (!s) return [];

  const parts = s
    .split(/[,\n;|]+/g)
    .map((p) => p.trim())
    .filter(Boolean);

  const normalized = parts.map(normalizeTeamLabel);

  const out: string[] = [];
  const seen = new Set<string>();

  for (const t of normalized) {
    const key = t.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(t);
    }
  }

  return out;
}

export function parseDate(input: unknown): Date | null {
  if (input === null || input === undefined) return null;

  if (typeof input === "number" && Number.isFinite(input)) {
    const d = new Date(input);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return null;

    if (/^\d{10,13}$/.test(trimmed)) {
      const n = Number(trimmed);
      const d = new Date(n);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    const m = trimmed.match(
      /^(\d{1,2})\.(\d{1,2})\.(\d{3,4})(?:\s+(\d{1,2}):(\d{2}))?$/
    );

    if (m) {
      const dd = Number(m[1]);
      const mm = Number(m[2]);
      let yyyy = Number(m[3]);

      if (m[3].length === 3 || yyyy < 1000) yyyy = 2000 + yyyy;

      const hh = m[4] ? Number(m[4]) : 0;
      const min = m[5] ? Number(m[5]) : 0;

      const d = new Date(yyyy, mm - 1, dd, hh, min, 0, 0);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function toKind(row: any): FeedKind {
  const raw = String(
    row?.type ?? row?.kind ?? row?.category ?? row?.Kategorie ?? ""
  ).toLowerCase();

  if (raw.includes("result") || raw.includes("ergebnis")) return "result";
  if (raw.includes("training") || raw.includes("workout")) return "training";
  if (raw.includes("news") || raw.includes("nachricht") || raw.includes("info")) return "news";

  return "unknown";
}

function normalizeRow(row: any): FeedRow {
  const id =
    cleanStr(row?.id ?? row?.ID ?? row?.key ?? row?.slug) ??
    `row-${Math.random().toString(36).slice(2, 9)}`;

  const type = cleanStr(row?.type ?? row?.Type ?? row?.Kategorie ?? row?.category);
  const kind = toKind(row);

  const title = cleanStr(row?.title ?? row?.headline ?? row?.titel ?? row?.Titel ?? row?.name);
  const text = cleanStr(row?.text ?? row?.body ?? row?.beschreibung ?? row?.desc ?? row?.Text);

  const image = cleanStr(
    row?.heroImageUrl ??
      row?.image ??
      row?.img ??
      row?.bild ??
      row?.imageUrl ??
      row?.Bild_URL
  );

  const linkUrl = cleanStr(row?.linkUrl ?? row?.url ?? row?.youtubeUrl);
  const linkLabel = cleanStr(row?.linkLabel ?? row?.linkText ?? row?.label);

  const dateRaw =
    row?.date ??
    row?.datum ??
    row?.Datum ??
    row?.created ??
    row?.timestamp ??
    row?.time;

  const date = parseDate(dateRaw);

  const dateLabel = date
    ? new Intl.DateTimeFormat("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    : cleanStr(row?.Datum ?? row?.date ?? row?.datum);

  const home = cleanStr(row?.homeTeam ?? row?.home ?? row?.heim ?? row?.teamHome);
  const away = cleanStr(row?.awayTeam ?? row?.away ?? row?.gast ?? row?.teamAway);

  const homeScore = cleanNum(row?.homeScore ?? row?.scoreHome ?? row?.heimPunkte);
  const awayScore = cleanNum(row?.awayScore ?? row?.scoreAway ?? row?.gastPunkte);

  const teamIds = cleanStr(
    row?.teamIds ?? row?.teamId ?? row?.team ?? row?.teams ?? row?.Kategorie
  );
  const teams = parseTeams(teamIds);

  const competition = cleanStr(row?.competition ?? row?.liga ?? row?.league);
  const venue = cleanStr(row?.venue ?? row?.halle ?? row?.stadion);
  const highlights = cleanStr(row?.highlights ?? row?.highlight ?? row?.notes);

  const trainingType = cleanStr(row?.trainingType ?? row?.training ?? row?.einheit);
  const durationMin = cleanNum(row?.durationMin ?? row?.minutes ?? row?.dauer);
  const intensity = cleanStr(row?.intensity ?? row?.belastung ?? row?.level);

  const category = cleanStr(row?.Kategorie ?? row?.category ?? row?.type);

  return {
    id,
    type,
    kind,
    title,
    text,
    image,
    linkUrl,
    linkLabel,
    dateRaw,
    date,
    dateLabel,
    home,
    away,
    homeScore,
    awayScore,
    teamIds,
    teams,
    competition,
    venue,
    highlights,
    trainingType,
    durationMin,
    intensity,
    category,
  };
}

function extractRows(data: ApiResponse): any[] {
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export async function fetchFeed(): Promise<FeedRow[]> {
  const url = buildUrl("get_beitraege", KUNDEN_ID);

  let res: Response;
  try {
    res = await fetch(url, { method: "GET" });
  } catch (e) {
    console.error("Feed fetch network error:", e);
    throw new Error("Feed load error: Netzwerkfehler");
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("Feed HTTP error:", res.status, txt);
    throw new Error(`Feed API HTTP ${res.status}`);
  }

  const data = (await res.json()) as ApiResponse;
  const rows = extractRows(data);

  if (!rows.length) {
    console.warn("Feed API empty payload:", data);
    return [];
  }

  return rows
    .map(normalizeRow)
    .filter((row) => row.id && row.title)
    .sort((a, b) => {
      const at = a.date ? a.date.getTime() : 0;
      const bt = b.date ? b
