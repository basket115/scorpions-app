// src/i18n/LanguageContext.tsx
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { translations, Lang } from './translations';

export type { Lang };
export const SUPPORTED_LANGS: Lang[] = ['de', 'hu', 'en'];
export const STORAGE_KEY = 'onlang_lang';
const FALLBACK_LANG: Lang = 'de';

function isSupported(val: string | null): val is Lang {
  return !!val && (SUPPORTED_LANGS as string[]).includes(val);
}

function detectInitialLang(): Lang {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (isSupported(fromUrl)) return fromUrl;

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isSupported(stored)) return stored;

    const nav = (window.navigator.language || '').slice(0, 2).toLowerCase();
    if (isSupported(nav)) return nav;
  } catch {
    // z.B. localStorage nicht verfügbar (Privacy Mode) -> Fallback
  }
  return FALLBACK_LANG;
}

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, fallback?: string) => string;
};

export const LanguageContext = createContext<LanguageContextValue>({
  lang: FALLBACK_LANG,
  setLang: () => {},
  t: (key: string, fallback?: string) => fallback ?? key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => detectInitialLang());

  const setLang = useCallback((next: Lang) => {
    if (!SUPPORTED_LANGS.includes(next)) return;
    setLangState(next);
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  }, []);

  // Fallback-Kette: gewählte Sprache -> Deutsch -> übergebener Fallback -> Key
  const t = useCallback((key: string, fallback?: string): string => {
    const row = translations[key];
    if (row) {
      const val = row[lang] || row[FALLBACK_LANG];
      if (val) return val;
    }
    return fallback ?? key;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
