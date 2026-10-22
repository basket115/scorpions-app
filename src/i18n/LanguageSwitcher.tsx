// src/i18n/LanguageSwitcher.tsx
import React from 'react';
import { useLanguage, SUPPORTED_LANGS, Lang } from './LanguageContext';

// kompakt (Kopfzeile): ein kleiner Knopf mit der aktuellen Sprache; Tippen
// oeffnet die Auswahl des Browsers/Handys (unsichtbares <select> darueber).
const LanguageSwitcher: React.FC<{ variant?: 'light' | 'dark'; kompakt?: boolean }> = ({ variant = 'light', kompakt = false }) => {
  const { lang, setLang } = useLanguage();
  const baseColor = variant === 'light' ? '#fff' : '#333';

  if (kompakt) {
    return (
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <span
          aria-hidden="true"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '4px 7px', borderRadius: 8,
            border: `1px solid ${variant === 'light' ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.25)'}`,
            color: baseColor, fontSize: 12, fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase',
          }}
        >
          {lang}
          <span style={{ fontSize: 9, opacity: 0.8 }}>▾</span>
        </span>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          aria-label="Sprache · Nyelv · Language"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', fontSize: 16 }}
        >
          {SUPPORTED_LANGS.map((l) => (
            <option key={l} value={l}>{l.toUpperCase()}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {SUPPORTED_LANGS.map((l, i) => (
        <React.Fragment key={l}>
          {i > 0 && <span style={{ color: baseColor, opacity: 0.35, fontSize: 12 }}>|</span>}
          <button
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px 4px',
              fontFamily: 'inherit',
              fontSize: 12,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: baseColor,
              opacity: lang === l ? 1 : 0.55,
              fontWeight: lang === l ? 900 : 700,
              textDecoration: lang === l ? 'underline' : 'none',
            }}
          >
            {l}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
