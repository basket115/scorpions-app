// src/components/LazyBild.tsx
//
// Bild erst laden, wenn es fast im Blickfeld ist (21.11.2026, iPhone-Absturz
// HU001). loading="lazy" allein reicht hier nicht: In der Scrollfläche von
// Ionic lädt Safari/WebKit trotzdem alle Bilder sofort. Darum ein eigener
// Wächter (IntersectionObserver): Bis das Bild etwa eine Bildschirmhöhe
// entfernt ist, steht nur ein grauer Platzhalter mit fester Höhe da.
// Ohne IntersectionObserver (sehr alte Browser) lädt das Bild sofort.
import React, { useEffect, useRef, useState } from 'react';

const VORLAUF = '800px 0px';

const LazyBild: React.FC<{ src: string; alt?: string; style?: React.CSSProperties; platzhalterHoehe?: number; referrerPolicy?: React.HTMLAttributeReferrerPolicy; onError?: () => void }> = ({ src, alt = '', style, platzhalterHoehe = 200, referrerPolicy, onError }) => {
  const [zeigen, setZeigen] = useState(() => typeof IntersectionObserver === 'undefined');
  const [geladen, setGeladen] = useState(false);
  const platz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (zeigen || !platz.current) return;
    const io = new IntersectionObserver((eintraege) => {
      if (eintraege.some((e) => e.isIntersecting)) { setZeigen(true); io.disconnect(); }
    }, { rootMargin: VORLAUF });
    io.observe(platz.current);
    return () => io.disconnect();
  }, [zeigen]);

  if (!zeigen) {
    // platzhalterHoehe 0 = Höhe kommt aus style (z. B. Video-Vorschau mit fester Fläche).
    const hoehe = platzhalterHoehe ? { height: platzhalterHoehe, minHeight: platzhalterHoehe } : {};
    return <div ref={platz} aria-hidden="true" style={{ ...style, ...hoehe, background: '#f2f2f2' }} />;
  }
  return (
    <img src={src} alt={alt} loading="lazy" decoding="async" referrerPolicy={referrerPolicy}
      onLoad={() => setGeladen(true)}
      onError={() => { setGeladen(true); if (onError) onError(); }}
      style={{ ...style, minHeight: geladen || !platzhalterHoehe ? undefined : platzhalterHoehe }} />
  );
};

export default LazyBild;
