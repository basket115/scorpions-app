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

  // ── Tab1.tsx: Beitrags-Feed, Formulare, Popups, Footer ────────
  error_upload_fehlgeschlagen: { de: 'Upload fehlgeschlagen.', hu: 'A feltöltés sikertelen volt.', en: 'Upload failed.' },
  status_wird_hochgeladen: { de: '⏳ Bild wird hochgeladen...', hu: '⏳ Kép feltöltése...', en: '⏳ Uploading image...' },
  btn_bild_hochladen: { de: '📁 Bild vom Computer hochladen', hu: '📁 Kép feltöltése a számítógépről', en: '📁 Upload image from computer' },
  btn_mehr_erfahren: { de: 'Mehr erfahren →', hu: 'Tudj meg többet →', en: 'Learn more →' },
  lbl_bild_url_anleitung: { de: '📸 Bild-URL Anleitung', hu: '📸 Kép-URL útmutató', en: '📸 Image URL guide' },
  btn_verstanden: { de: 'Verstanden ✓', hu: 'Értem ✓', en: 'Got it ✓' },
  status_sponsor_gespeichert: { de: '✅ Sponsor gespeichert!', hu: '✅ Szponzor mentve!', en: '✅ Sponsor saved!' },
  status_fehler: { de: 'Fehler: ', hu: 'Hiba: ', en: 'Error: ' },
  error_unbekannt: { de: 'Unbekannt', hu: 'Ismeretlen', en: 'Unknown' },
  btn_sponsor: { de: '🤝 SPONSOR EINRICHTEN', hu: '🤝 SZPONZOR BEÁLLÍTÁSA', en: '🤝 SET UP SPONSOR' },
  title_sponsor: { de: '🤝 Sponsor einrichten', hu: '🤝 Szponzor beállítása', en: '🤝 Set up sponsor' },
  lbl_logo_url: { de: 'Logo URL', hu: 'Logó URL', en: 'Logo URL' },
  lbl_banner_text: { de: 'Banner Text', hu: 'Banner szöveg', en: 'Banner text' },
  lbl_link_url: { de: 'Link URL', hu: 'Link URL', en: 'Link URL' },
  btn_abbrechen: { de: 'Abbrechen', hu: 'Mégse', en: 'Cancel' },
  btn_speichern_laeuft: { de: 'Speichern...', hu: 'Mentés...', en: 'Saving...' },
  btn_sponsor_speichern: { de: '💾 Sponsor speichern', hu: '💾 Szponzor mentése', en: '💾 Save sponsor' },
  btn_bearbeiten: { de: '✏️ Beitrag bearbeiten', hu: '✏️ Bejegyzés szerkesztése', en: '✏️ Edit post' },
  lbl_titel: { de: 'Titel', hu: 'Cím', en: 'Title' },
  lbl_text: { de: 'Text', hu: 'Szöveg', en: 'Text' },
  lbl_beitragsbild: { de: 'Bild URL', hu: 'Kép URL', en: 'Image URL' },
  hinweis_bild_url_beispiel: { de: 'https://i.imgur.com/... oder Google Drive Link', hu: 'https://i.imgur.com/... vagy Google Drive link', en: 'https://i.imgur.com/... or Google Drive link' },
  lbl_vorschau: { de: 'Vorschau', hu: 'Előnézet', en: 'Preview' },
  lbl_video_url: { de: '▶ YouTube URL', hu: '▶ YouTube URL', en: '▶ YouTube URL' },
  btn_speichern: { de: '💾 Speichern', hu: '💾 Mentés', en: '💾 Save' },
  lbl_alle_abteilungen: { de: 'Alle Abteilungen', hu: 'Minden szakosztály', en: 'All departments' },
  status_beitrag_gespeichert: { de: '✅ Beitrag gespeichert!', hu: '✅ Bejegyzés mentve!', en: '✅ Post saved!' },
  error_keine_id: { de: 'Keine ID.', hu: 'Nincs azonosító.', en: 'No ID.' },
  lbl_rolle_hauptadmin: { de: '👑 Hauptadmin', hu: '👑 Főadminisztrátor', en: '👑 Main admin' },
  lbl_rolle_abteilungsleiter: { de: '🏅 Abteilungsleiter', hu: '🏅 Szakosztályvezető', en: '🏅 Department head' },
  btn_abmelden: { de: 'Abmelden', hu: 'Kijelentkezés', en: 'Log out' },
  btn_neuer_beitrag: { de: '⊕ NEUEN BEITRAG ERSTELLEN', hu: '⊕ ÚJ BEJEGYZÉS LÉTREHOZÁSA', en: '⊕ CREATE NEW POST' },
  title_neuer_beitrag: { de: '📝 Neuer Beitrag', hu: '📝 Új bejegyzés', en: '📝 New post' },
  lbl_bild_url_optional: { de: 'Bild URL (optional)', hu: 'Kép URL (opcionális)', en: 'Image URL (optional)' },
  lbl_video_url_optional: { de: '▶ YouTube URL (optional)', hu: '▶ YouTube URL (opcionális)', en: '▶ YouTube URL (optional)' },
  lbl_kategorie: { de: 'Kategorie: ', hu: 'Kategória: ', en: 'Category: ' },
  btn_publish_laeuft: { de: 'Speichern...', hu: 'Mentés...', en: 'Saving...' },
  btn_publish: { de: 'Veröffentlichen', hu: 'Közzététel', en: 'Publish' },
  hinweis_keine_eintraege: { de: 'Noch keine Beiträge.', hu: 'Még nincsenek bejegyzések.', en: 'No posts yet.' },
  lbl_nutzungsbedingungen: { de: '📋 Nutzungsbedingungen', hu: '📋 Felhasználási feltételek', en: '📋 Terms of use' },
  lbl_bildverwaltung: { de: '📸 Bildverwaltung', hu: '📸 Képkezelés', en: '📸 Image management' },

  // ── Tab1.tsx: Kategorien (nur bekannte, im Kunden_Master gepflegte
  //    Bezeichnungen; siehe translateKategorie() unten) ───────────
  kategorie_news: { de: 'News', hu: 'Hírek', en: 'News' },
  kategorie_vorstand: { de: 'Vorstand', hu: 'Vezetőség', en: 'Board' },
  kategorie_jugend: { de: 'Jugend', hu: 'Utánpótlás', en: 'Youth' },
  kategorie_ergebnisse: { de: 'Ergebnisse', hu: 'Eredmények', en: 'Results' },
  kategorie_spielplan: { de: 'Spielplan', hu: 'Menetrend', en: 'Schedule' },
  kategorie_damen: { de: 'Damen', hu: 'Női csapat', en: 'Women' },
  kategorie_herren: { de: 'Herren', hu: 'Férfi csapat', en: 'Men' },
  kategorie_infos: { de: 'Infos', hu: 'Információk', en: 'Information' },
  kategorie_live: { de: 'Live', hu: 'Élő', en: 'Live' },
  kategorie_verein: { de: 'Verein', hu: 'Egyesület', en: 'Club' },
};

// Ordnet den technischen Kategorienamen aus dem Kunden_Master (Spalte
// "Kategorien", z.B. "News", "Vorstand", "Damen") auf den passenden
// Übersetzungs-Key ab. Nur exakt hier gelistete Namen werden übersetzt;
// alles andere (Mannschaftscodes wie U10/U12/U16/BBL/ProB/Academy,
// Eigennamen etc.) bleibt bewusst unangetastet.
const KATEGORIE_KEYS: Record<string, string> = {
  News: 'kategorie_news',
  Vorstand: 'kategorie_vorstand',
  Jugend: 'kategorie_jugend',
  Ergebnisse: 'kategorie_ergebnisse',
  Spielplan: 'kategorie_spielplan',
  Damen: 'kategorie_damen',
  Herren: 'kategorie_herren',
  Infos: 'kategorie_infos',
  Live: 'kategorie_live',
  Verein: 'kategorie_verein',
};

// Übersetzt nur den ANGEZEIGTEN Kategorienamen. Der technische Wert
// (Filterwert, gespeicherter Kategoriename, API-Parameter) bleibt in
// jedem Aufrufer unverändert - diese Funktion wird ausschließlich an
// Anzeige-Stellen verwendet, nie zum Setzen von State oder Vergleichen.
export function translateKategorie(kategorie: string, t: (key: string, fallback?: string) => string): string {
  if (!kategorie) return kategorie;
  const key = KATEGORIE_KEYS[kategorie];
  if (!key) return kategorie;
  return t(key, kategorie);
}
