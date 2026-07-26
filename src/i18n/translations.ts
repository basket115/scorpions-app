// src/i18n/translations.ts
//
// Lokaler Fallback für UI-Texte, solange das Backend (Google Apps Script)
// keinen eigenen Übersetzungs-Endpunkt liefert (siehe Prüfung in App.tsx-Bericht).
// Sobald ein Endpunkt wie `action=getTranslations` verfügbar ist, kann dieses
// Objekt durch die Sheet-Daten ersetzt/überschrieben werden, ohne dass sich
// die t()-API (LanguageContext) ändert.
//
// Key-Namenskonvention folgt dem bestehenden Google-Sheet "Sprache"
// (btn_, lbl_, hinweis_, status_, error_ ...). HU/EN-Werte sind vorläufige
// Übersetzungen und sollten mit dem Sheet abgeglichen werden, sobald es
// eingesehen werden kann.

export type Lang = 'de' | 'hu' | 'en';

export type TranslationRow = { de: string; hu: string; en: string };

export const translations: Record<string, TranslationRow> = {
  // ── App.tsx: Admin-/Team-Login ──────────────────────────────
  login_password_placeholder: { de: 'Passwort eingeben', hu: 'Jelszó megadása', en: 'Enter password' },
  status_laden: { de: 'Laden...', hu: 'Betöltés...', en: 'Loading...' },
  hinweis_team_login: { de: 'Bitte mit deinem Team-Passwort einloggen', hu: 'Kérjük, jelentkezz be a csapat jelszavával', en: 'Please log in with your team password' },
  btn_login: { de: 'Einloggen', hu: 'Bejelentkezés', en: 'Log in' },
  btn_login_laeuft: { de: 'Einloggen...', hu: 'Bejelentkezés...', en: 'Logging in...' },
  btn_weiter_ohne_login: { de: 'Weiter ohne Login →', hu: 'Tovább bejelentkezés nélkül →', en: 'Continue without login →' },
  lbl_admin_login: { de: 'Admin Login', hu: 'Admin bejelentkezés', en: 'Admin login' },
  btn_zurueck_zur_app: { de: '← Zurück zur App', hu: '← Vissza az alkalmazáshoz', en: '← Back to app' },
  error_falsches_passwort: { de: 'Falsches Passwort!', hu: 'Hibás jelszó!', en: 'Incorrect password!' },
  error_verbindungsfehler: { de: 'Verbindungsfehler', hu: 'Kapcsolati hiba', en: 'Connection error' },
  error_login_fehlgeschlagen: { de: 'Login Fehler', hu: 'Bejelentkezési hiba', en: 'Login error' },

  // ── AppHeader.tsx ────────────────────────────────────────────
  lbl_partner: { de: 'PARTNER', hu: 'PARTNER', en: 'PARTNER' },
  lbl_admin_tooltip: { de: 'Admin', hu: 'Admin', en: 'Admin' },
};
