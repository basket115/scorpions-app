// Anmeldung in der App mit E-Mail + Passwort – derselbe Supabase-Login wie
// im Studio und im Admin (ein Zugang für alles). Direkt gegen Supabase Auth,
// ohne zusätzliche Bibliothek.
//
// Der Schlüssel unten ist der ÖFFENTLICHE Projektschlüssel (wie in
// studio-auth.js auf app.onlang.de). Schreibrechte prüft der App-Server
// (/api/proxy) anhand des Logins und der Tabelle "benutzer".

const SUPABASE_URL = 'https://ccwlglszhwvbhzhdtxtl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hFwqCDf1pMIYkXMq7a0jyQ_XcweL-mS';
const SPEICHER = 'onlang_app_login';
// Token so früh erneuern, dass es beim Speichern sicher noch gilt
const PUFFER_SEKUNDEN = 120;

export type Sitzung = { access_token: string; refresh_token: string; expires_at: number; email: string };

function lies(): Sitzung | null {
  try {
    const roh = localStorage.getItem(SPEICHER);
    const s = roh ? JSON.parse(roh) : null;
    return s && s.access_token && s.refresh_token ? s : null;
  } catch {
    return null;
  }
}

function merke(s: Sitzung | null) {
  try {
    if (s) localStorage.setItem(SPEICHER, JSON.stringify(s));
    else localStorage.removeItem(SPEICHER);
  } catch { /* privates Fenster: dann nur für diese Seite */ }
}

async function tokenAnfrage(art: 'password' | 'refresh_token', inhalt: Record<string, string>): Promise<Sitzung | null> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=${art}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(inhalt),
  });
  if (!res.ok) return null;
  const d = await res.json();
  if (!d.access_token || !d.refresh_token) return null;
  return {
    access_token: d.access_token,
    refresh_token: d.refresh_token,
    expires_at: Number(d.expires_at) || Math.floor(Date.now() / 1000) + Number(d.expires_in || 3600),
    email: String(d.user?.email || inhalt.email || ''),
  };
}

// true = angemeldet; false = E-Mail oder Passwort falsch. Wirft bei Netzfehler.
export async function anmelden(email: string, passwort: string): Promise<boolean> {
  const s = await tokenAnfrage('password', { email: email.trim(), password: passwort });
  merke(s);
  return !!s;
}

export function hatSitzung(): boolean {
  return !!lies();
}

// Gültiges Login-Token (bei Bedarf erneuert) oder null.
export async function gueltigesToken(): Promise<string | null> {
  const s = lies();
  if (!s) return null;
  if (s.expires_at - PUFFER_SEKUNDEN > Date.now() / 1000) return s.access_token;
  try {
    const neu = await tokenAnfrage('refresh_token', { refresh_token: s.refresh_token });
    merke(neu);
    return neu ? neu.access_token : null;
  } catch {
    return null;
  }
}

// Kopfzeilen für Schreibaufrufe an /api/proxy: mit E-Mail-Login das Token,
// sonst nichts (dann gilt der alte Weg mit App-Passwort im Body).
export async function loginKopf(): Promise<Record<string, string>> {
  const token = await gueltigesToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function abmelden(): Promise<void> {
  const s = lies();
  merke(null);
  if (!s) return;
  try {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${s.access_token}` },
    });
  } catch { /* lokal ist abgemeldet */ }
}

// Seite zum Zurücksetzen des Passworts (dieselbe wie für Studio und Admin)
export function passwortVergessenAdresse(sprache: string): string {
  return `https://app.onlang.de/anmelden.html?lang=${encodeURIComponent(sprache || 'de')}`;
}
