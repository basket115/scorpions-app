// src/i18n/LanguageSwitcher.tsx
import React from 'react';
import { useLanguage, SUPPORTED_LANGS } from './LanguageContext';

const LanguageSwitcher: React.FC<{ variant?: 'light' | 'dark' }> = ({ variant = 'light' }) => {
  const { lang, setLang } = useLanguage();
  const baseColor = variant === 'light' ? '#fff' : '#333';

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
