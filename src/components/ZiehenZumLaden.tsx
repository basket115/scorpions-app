// src/components/ZiehenZumLaden.tsx
//
// Neu laden durch "nach unten ziehen" (18.11.2026, Vorschlag zum Live-Zeichen):
// Der Neu-Laden-Knopf oben rechts ist dem Live-Zeichen gewichen. Steht die
// Liste ganz oben und zieht man mit dem Finger nach unten, erscheint ein
// Kreis-Pfeil; ab ca. 70 px loslassen = neu laden. Am PC (Maus) unverändert
// mit F5 bzw. dem Neu-laden-Knopf des Browsers.
import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const SCHWELLE = 70;
const MAX = 110;

export function useZiehenZumLaden(
  bereich: React.RefObject<HTMLElement>,
  laden: () => void | Promise<void>,
  laedt: boolean
) {
  const [weg, setWeg] = useState(0);
  const start = useRef<number | null>(null);
  const wegRef = useRef(0);
  const ladenRef = useRef(laden);
  ladenRef.current = laden;

  useEffect(() => {
    const el = bereich.current;
    if (!el) return;
    const beginn = (e: TouchEvent) => {
      start.current = el.scrollTop <= 0 && e.touches.length === 1 ? e.touches[0].clientY : null;
    };
    const bewegen = (e: TouchEvent) => {
      if (start.current === null) return;
      const dy = e.touches[0].clientY - start.current;
      if (dy <= 0 || el.scrollTop > 0) { wegRef.current = 0; setWeg(0); return; }
      // Gedämpft: der Kreis folgt dem Finger nur halb so weit.
      const w = Math.min(MAX, dy * 0.5);
      wegRef.current = w;
      setWeg(w);
      if (e.cancelable) e.preventDefault();
    };
    const ende = () => {
      if (start.current !== null && wegRef.current >= SCHWELLE) ladenRef.current();
      start.current = null;
      wegRef.current = 0;
      setWeg(0);
    };
    el.addEventListener('touchstart', beginn, { passive: true });
    el.addEventListener('touchmove', bewegen, { passive: false });
    el.addEventListener('touchend', ende);
    el.addEventListener('touchcancel', ende);
    return () => {
      el.removeEventListener('touchstart', beginn);
      el.removeEventListener('touchmove', bewegen);
      el.removeEventListener('touchend', ende);
      el.removeEventListener('touchcancel', ende);
    };
  }, [bereich]);

  return { weg, laedt };
}

export const ZiehenAnzeige: React.FC<{ weg: number; laedt: boolean; farbe?: string }> = ({ weg, laedt, farbe }) => {
  const { t } = useLanguage();
  const sichtbar = laedt || weg > 0;
  if (!sichtbar) return null;
  const bereit = weg >= SCHWELLE;
  const hoehe = laedt ? 44 : weg;
  return (
    <div style={{ height: hoehe, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: farbe || '#555', fontSize: 13, fontWeight: 600, flexShrink: 0, background: '#f0f0f0' }}
      aria-live="polite">
      <span style={{ display: 'inline-block', fontSize: 20, transform: `rotate(${laedt ? 0 : weg * 3}deg)`, animation: laedt ? 'onlang-dreh 0.8s linear infinite' : undefined }}>↻</span>
      <span>{laedt ? t('status_laden', 'Laden...') : bereit ? t('ziehen_loslassen', 'Loslassen zum Aktualisieren') : t('ziehen_weiter', 'Nach unten ziehen zum Aktualisieren')}</span>
      <style>{'@keyframes onlang-dreh { to { transform: rotate(360deg) } }'}</style>
    </div>
  );
};
