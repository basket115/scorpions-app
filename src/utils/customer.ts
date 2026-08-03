// src/utils/customer.ts
// Phase 0 / Schritt 2 – EINZIGE verbindliche Kundenauflösung der gesamten App.
// Kein Vereins-Fallback. Kein V002/V006/DEFAULT. Bei fehlender/ungueltiger ID -> null.

const ID_MUSTER = /^[A-Z0-9_-]{1,20}$/;

/**
 * Liest die Kunden-ID ausschliesslich aus der URL (?kunde= bzw. kompatibel ?kundenId=).
 * Normalisiert (trim + Grossbuchstaben) und validiert das Zeichenmuster.
 * Faellt NICHT auf einen festen Verein zurueck.
 * Kompatibilitaet: wurde zuvor eine gueltige ID gewaehlt, wird die eigene
 * zuletzt genutzte ID erinnert (kein fremder Verein) – z. B. fuer die installierte PWA.
 */
export function resolveCustomerId(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = (params.get('kunde') || params.get('kundenId') || '').trim();
    if (raw) {
      const norm = raw.toUpperCase();
      if (!ID_MUSTER.test(norm)) return null;
      try { localStorage.setItem('kundenId', norm); } catch { /* ignore */ }
      return norm;
    }
    // Keine ID in der URL -> zuletzt eigene gewaehlte ID (KEIN Vereins-Fallback)
    let stored = '';
    try { stored = (localStorage.getItem('kundenId') || '').trim().toUpperCase(); } catch { /* ignore */ }
    if (stored && ID_MUSTER.test(stored)) return stored;
    return null;
  } catch {
    return null;
  }
}

/** Neutraler Fehlertext, wenn keine gueltige Kunden-ID vorliegt (niemals ein Ersatzverein). */
export function noCustomerText(lang?: string): string {
  return String(lang || '').toLowerCase() === 'hu'
    ? 'A klub adatai nem tölthetők be.'
    : 'Der Verein konnte nicht geladen werden.';
}
