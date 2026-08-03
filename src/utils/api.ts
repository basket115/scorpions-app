// src/utils/api.ts
// Phase 0 / Schritt 2 – EINZIGER API-Weg der App: der Netlify-Proxy (kanonisches Backend).
// Kein Component besitzt eine eigene GAS-URL. Timeout, 1 Retry, Status-/Content-Type-/JSON-Pruefung.

import { resolveCustomerId } from './customer';

export const PROXY_BASE = '/api/proxy';

export class ApiError extends Error {
  klasse: string;
  constructor(klasse: string, message?: string) {
    super(message || klasse);
    this.klasse = klasse;
  }
}

function buildUrl(action: string, extra: Record<string, string>, withKunde: boolean): string {
  const params = new URLSearchParams({ action, ...extra });
  if (withKunde) {
    const kunde = resolveCustomerId();
    if (!kunde) throw new ApiError('NoCustomer', 'Keine gueltige Kunden-ID');
    params.set('kundenId', kunde);
  }
  return `${PROXY_BASE}?${params.toString()}&_cb=${Date.now()}`;
}

async function once(url: string): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000); // ~12s Timeout
  try {
    const resp = await fetch(url, { cache: 'no-store', redirect: 'follow', signal: ctrl.signal });
    if (!resp.ok) throw new ApiError('HttpError', 'HTTP ' + resp.status);
    const ct = resp.headers.get('content-type') || '';
    const text = await resp.text();
    if (ct.indexOf('application/json') === -1 && /^\s*</.test(text)) {
      throw new ApiError('ContentTypeError', 'HTML statt JSON');
    }
    try { return JSON.parse(text); }
    catch { throw new ApiError('ParseError', 'JSON nicht lesbar'); }
  } catch (e: any) {
    if (e && e.name === 'AbortError') throw new ApiError('TimeoutError', 'Timeout');
    if (e instanceof ApiError) throw e;
    throw new ApiError('NetworkError', e && e.message);
  } finally {
    clearTimeout(timer);
  }
}

/** GET ueber den Proxy; haengt kundenId automatisch an (ausser withKunde=false). Genau 1 Retry. */
export async function apiGet(
  action: string,
  extra: Record<string, string> = {},
  withKunde: boolean = true
): Promise<any> {
  const url = buildUrl(action, extra, withKunde);
  try {
    return await once(url);
  } catch (e1) {
    if (e1 instanceof ApiError && e1.klasse === 'NoCustomer') throw e1; // kein Retry ohne Kunde
    await new Promise((r) => setTimeout(r, 700));
    return await once(buildUrl(action, extra, withKunde));
  }
}
