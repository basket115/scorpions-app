// src/components/VideoVorschau.tsx
//
// YouTube-Video erst beim Antippen laden (21.11.2026, iPhone-Absturz HU001):
// Vorher lud die App jedes YouTube-Video sofort als eigenen Player (iframe).
// Bei HU001 waren das 49 Player auf einmal – zu viel Speicher für Safari auf
// dem iPhone, die Seite stürzte immer wieder ab.
//
// Jetzt: zuerst nur das Vorschaubild von YouTube (lädt erst beim
// Hinscrollen) mit einem Play-Knopf. EIN Tippen = der Player kommt und das
// Video startet sofort. Kein Datenschutz-Text (Laszlos Entscheidung).
//
// Start sofort: Auf iPhone/iPad startet ein frisch eingesetzter YouTube-
// Player oft nicht von selbst. Deshalb dort (wie bei "lite-youtube-embed")
// über die YouTube-Schnittstelle (iframe_api) mit playVideo(). Klappt das
// nicht innerhalb von 4 Sekunden, kommt der normale Player mit autoplay=1.
import React, { useEffect, useRef, useState } from 'react';

const HOST = 'https://www.youtube-nocookie.com';

declare global {
  interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void }
}

let apiVersprechen: Promise<any> | null = null;
function ladeYouTubeApi(): Promise<any> {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (apiVersprechen) return apiVersprechen;
  apiVersprechen = new Promise((resolve, reject) => {
    const vorher = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (vorher) vorher(); resolve(window.YT); };
    const skript = document.createElement('script');
    skript.src = 'https://www.youtube.com/iframe_api';
    skript.async = true;
    skript.onerror = () => { apiVersprechen = null; reject(new Error('iframe_api')); };
    document.head.appendChild(skript);
  });
  return apiVersprechen;
}

const brauchtApi = (): boolean =>
  typeof navigator !== 'undefined' && (/Apple/.test(navigator.vendor || '') || /Mobi/.test(navigator.userAgent || ''));

const flaeche: React.CSSProperties = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' };

const VideoVorschau: React.FC<{ youtubeId: string; titel?: string; style?: React.CSSProperties }> = ({ youtubeId, titel, style }) => {
  // 'bild' = nur Vorschaubild, 'api' = Player über iframe_api, 'iframe' = normaler Player
  const [zustand, setZustand] = useState<'bild' | 'api' | 'iframe'>('bild');
  const [bildFehler, setBildFehler] = useState(false);
  const platz = useRef<HTMLDivElement>(null);
  const player = useRef<any>(null);

  useEffect(() => {
    if (zustand !== 'api') return;
    let aus = false;
    const notfall = setTimeout(() => { if (!aus && !player.current) setZustand('iframe'); }, 4000);
    ladeYouTubeApi().then((YT) => {
      if (aus || !platz.current) return;
      // Eigenes Element, das React nicht kennt: YouTube ersetzt es durch
      // den Player, React räumt nur die Hülle weg.
      const ziel = document.createElement('div');
      platz.current.appendChild(ziel);
      player.current = new YT.Player(ziel, {
        host: HOST,
        videoId: youtubeId,
        width: '100%',
        height: '100%',
        playerVars: { autoplay: 1, playsinline: 1, rel: 0 },
        events: { onReady: (e: any) => { try { e.target.playVideo(); } catch { /* Knopf im Player bleibt */ } } },
      });
    }).catch(() => { if (!aus) setZustand('iframe'); });
    return () => {
      aus = true;
      clearTimeout(notfall);
      try { player.current && player.current.destroy && player.current.destroy(); } catch { /* egal */ }
      player.current = null;
      if (platz.current) platz.current.innerHTML = '';
    };
  }, [zustand, youtubeId]);

  const huelle: React.CSSProperties = { position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 8, overflow: 'hidden', background: '#000', ...style };

  if (zustand === 'iframe') {
    return (
      <div style={huelle}>
        <iframe src={`${HOST}/embed/${youtubeId}?rel=0&autoplay=1&playsinline=1`} style={flaeche}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={titel || 'Video'} />
      </div>
    );
  }
  if (zustand === 'api') {
    return (
      <div style={huelle}>
        <div ref={platz} className="onlang-video-platz" style={flaeche} />
        <style>{'.onlang-video-platz iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0 }'}</style>
      </div>
    );
  }
  return (
    <div style={huelle}>
      <button type="button" onClick={() => setZustand(brauchtApi() ? 'api' : 'iframe')}
        aria-label={(titel ? titel + ' – ' : '') + 'Video abspielen'}
        style={{ ...flaeche, padding: 0, margin: 0, cursor: 'pointer', background: '#000', display: 'block' }}>
        {!bildFehler && (
          <img src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`} alt="" loading="lazy" decoding="async"
            onError={() => setBildFehler(true)} referrerPolicy="no-referrer"
            style={{ ...flaeche, objectFit: 'cover' }} />
        )}
        <span aria-hidden="true" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 68, height: 48, borderRadius: 12, background: 'rgba(225, 0, 0, 0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,.35)' }}>
          <span style={{ width: 0, height: 0, borderTop: '11px solid transparent', borderBottom: '11px solid transparent', borderLeft: '18px solid #fff', marginLeft: 4 }} />
        </span>
      </button>
    </div>
  );
};

export default VideoVorschau;
