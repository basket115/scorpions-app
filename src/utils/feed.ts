// src/utils/feed.ts

export type FeedKind = "news" | "result" | "training" | "unknown";

export type ApiResponse = {
  ok: boolean;
  count: number;
  rows: any[];
};

export type FeedRow = {
  id: string; // p1, p2, p3, ...

  // backward compatible (falls irgendwo noch item.type genutzt wird)
  type?: string;

  kind: FeedKind;

  title?: string;
  text?: string;
  image?: string;

  // optional link (z.B. YouTube)
  linkUrl?: string;
  linkLabel?: string;

  dateRaw?: string | number;
  date?: Date | null;
  dateLabel?: string;

  // result fields
  home?: string;
  away?: string;
  homeScore?: number | null;
  awayScore?: number | null;

  teamIds?: string; // original string
  teams?: string[]; // normalized list for chips
  competition?: string;
  venue?: string;
  highlights?: string;

  // training (optional)
  trainingType?: string;
  durationMin?: number | null;
  intensity?: string;
};

const FEED_URL =
  "https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLiZ86A1GlqcYt-hoJsQb-VCRTpIqxXRh338ge-bTsdbuMKav1qDTS3CMHvkXuMBhYJIPIvWXUNB4mZlvKwlUORrJM1s9wbDpcIVIDozCOVU6NjLLnwU8Ua1JgkRNDFL6zLwrjhlj4SLKfZUDasCuYF85oP72NlIPWSt_fVfas7rD8k92X3juebbaBxmvziPH9OgVuGatg_nusbagQ8grlEQIleID4PlP-FeUN1d2oDrzTLYKJbXAnNCnmwUUHomGlwk1Ikcmv8MYOn_mbkxOLnLlI_E7Q&lib=MdDVvlA06KFKGs1TT4YmGsf-v0S0TKgyJ";

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

/**
 * Normalizes team labels to your official naming.
 */
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
  ];

  for (const [rx, label] of known) {
    if (rx.test(s)) return label;
  }

  // Generic improvements
  s = s.replace(/\bu(\d{1,2})\b/gi, (_m, num) => `U${num}`);
  s = s.charAt(0).toUpperCase() + s.slice(1);

  if (/^(männliche|maennliche)/i.test(s)) s = s.replace(/^(männliche|maennliche)/i, "Männliche");
  if (/^weibliche/i.test(s)) s = s.replace(/^weibliche/i, "Weibliche");
  s = s.replace(/\bOffen\b/g, "offen");

  return s;
}

/**
 * Turns a teamIds field into an array of normalized teams.
 */
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

/**
 * Parse many date formats, incl. typo year like 206 -> 2026.
 */
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
  const raw = String(row?.type ?? row?.kind ?? row?.category ?? "").toLowerCase();

  if (raw.includes("result") || raw.includes("ergebnis")) return "result";
  if (raw.includes("training") || raw.includes("workout")) return "training";
  if (raw.includes("news") || raw.includes("nachricht")) return "news";

  return "unknown";
}

function normalizeRow(row: any): FeedRow {
  const id = cleanStr(row?.id ?? row?.ID ?? row?.key ?? row?.slug) ?? "(ohne-id)";

  const type = cleanStr(row?.type);
  const kind = toKind(row);

  const title = cleanStr(row?.title ?? row?.headline ?? row?.titel ?? row?.name);
  const text = cleanStr(row?.text ?? row?.body ?? row?.beschreibung ?? row?.desc);

  const image = cleanStr(
    row?.heroImageUrl ?? row?.image ?? row?.img ?? row?.bild ?? row?.imageUrl
  );

  // YouTube / link support (dein JSON hat linkUrl + linkLabel)
  const linkUrl = cleanStr(row?.linkUrl ?? row?.url ?? row?.youtubeUrl);
  const linkLabel = cleanStr(row?.linkLabel ?? row?.linkText ?? row?.label);

  const dateRaw = row?.date ?? row?.datum ?? row?.created ?? row?.timestamp ?? row?.time;
  const date = parseDate(dateRaw);

  const dateLabel = date
    ? new Intl.DateTimeFormat("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    : undefined;

  const home = cleanStr(row?.homeTeam ?? row?.home ?? row?.heim ?? row?.teamHome);
  const away = cleanStr(row?.awayTeam ?? row?.away ?? row?.gast ?? row?.teamAway);

  const homeScore = cleanNum(row?.homeScore ?? row?.scoreHome ?? row?.heimPunkte);
  const awayScore = cleanNum(row?.awayScore ?? row?.scoreAway ?? row?.gastPunkte);

  const teamIds = cleanStr(row?.teamIds ?? row?.teamId ?? row?.team ?? row?.teams);
  const teams = parseTeams(teamIds);

  const competition = cleanStr(row?.competition ?? row?.liga ?? row?.league);
  const venue = cleanStr(row?.venue ?? row?.halle ?? row?.stadion);
  const highlights = cleanStr(row?.highlights ?? row?.highlight ?? row?.notes);

  const trainingType = cleanStr(row?.trainingType ?? row?.training ?? row?.einheit);
  const durationMin = cleanNum(row?.durationMin ?? row?.minutes ?? row?.dauer);
  const intensity = cleanStr(row?.intensity ?? row?.belastung ?? row?.level);

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
  };
}

export async function fetchFeed(): Promise<FeedRow[]> {
  let res: Response;
  try {
    res = await fetch(FEED_URL, { method: "GET" });
  } catch (e) {
    console.error("Feed fetch network error:", e);
    throw new Error("Feed load error: Failed to fetch");
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("Feed HTTP error:", res.status, txt);
    throw new Error(`Feed API HTTP ${res.status}`);
  }

  const data = (await res.json()) as ApiResponse;

  if (!data?.ok || !Array.isArray(data?.rows)) {
    console.error("Feed API invalid payload:", data);
    throw new Error("Feed API: ungültige Antwort (ok/rows fehlt)");
  }

  return data.rows.map(normalizeRow);
}
