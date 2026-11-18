// src/components/LiveZeichen.tsx
//
// Live-Zeichen oben rechts in der Kopfzeile (18.11.2026, Laszlos Entscheidung):
// ersetzt den Neu-Laden-Knopf, bei ALLEN Vereinen (auch Demo-Vereinen).
// - Grau/weiß umrandet: gerade kein Spiel des Vereins.
// - Rot und blinkend: ein Spiel des Vereins läuft (Abfrage jede Minute
//   über /api/proxy?action=live_status, die App-Adresse fragt live.onlang.de).
// - Antippen: kleines Fenster mit zwei Knöpfen
//     "Zuschauen"      -> Zuschauer-Seite des eigenen Vereins, ohne Anmeldung
//     "Kamera starten" -> live.onlang.de/bedienfeld.html; ohne Anmeldung
//                         leitet der Live-Server selbst zum Anmeldefeld und
//                         danach ins Bedienfeld.
import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { AkzentFarben } from '../utils/akzentfarbe';
import { PROXY_BASE } from '../utils/api';

const LIVE_BASIS = 'https://live.onlang.de';
const ABFRAGE_MS = 60000;

type LiveSpiel = { kanal: string; heimTeam: string; gastTeam: string; heim: number | null; gast: number | null };

// Blinken nur über CSS; wer "Bewegung reduzieren" eingestellt hat, sieht das
// Zeichen rot, aber ruhig.
const STIL = `
@keyframes onlang-live-blink { 0%, 100% { opacity: 1 } 50% { opacity: .25 } }
.onlang-live-zeichen { display: inline-flex; align-items: center; gap: 5px; height: 26px; padding: 0 9px;
  border-radius: 999px; border: 1.5px solid rgba(255,255,255,.85); background: transparent; color: #fff;
  font: 800 11px/1 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; letter-spacing: .08em;
  cursor: pointer; margin: 0 6px 0 2px; -webkit-tap-highlight-color: transparent; }
.onlang-live-zeichen .punkt { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.85); }
.onlang-live-zeichen.an { background: #e10600; border-color: #fff; box-shadow: 0 0 0 2px rgba(225,6,0,.35); }
.onlang-live-zeichen.an .punkt { background: #fff; animation: onlang-live-blink 1s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .onlang-live-zeichen.an .punkt { animation: none; } }
`;

const s: Record<string, React.CSSProperties> = {
  huelle: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  karte: { background: 'white', color: '#222', borderRadius: 16, padding: 22, maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  kopf: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  titel: { margin: 0, fontSize: 18, fontWeight: 700 },
  zu: { background: 'none', border: 'none', fontSize: 26, lineHeight: 1, cursor: 'pointer', color: '#999', padding: 4 },
  laeuft: { background: '#fdecea', color: '#b00000', borderRadius: 10, padding: '10px 12px', fontSize: 15, fontWeight: 700, margin: '0 0 12px' },
  still: { color: '#666', fontSize: 14, margin: '0 0 12px', lineHeight: 1.4 },
  knopf: { display: 'block', width: '100%', padding: '15px 12px', borderRadius: 12, fontWeight: 800, fontSize: 17, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' },
  klein: { color: '#777', fontSize: 12.5, margin: '6px 2px 0', lineHeight: 1.35 },
};

function spielZeile(sp: LiveSpiel): string {
  const teams = [sp.heimTeam, sp.gastTeam].filter(Boolean).join(' – ');
  const stand = sp.heim !== null && sp.gast !== null ? ` ${sp.heim}:${sp.gast}` : '';
  return (teams || sp.kanal) + stand;
}

const LiveZeichen: React.FC<{ kundenId: string; themaFarbe?: string; akzent?: AkzentFarben }> = ({ kundenId, themaFarbe, akzent }) => {
  const { t } = useLanguage();
  const [spiele, setSpiele] = useState<LiveSpiel[]>([]);
  const [offen, setOffen] = useState(false);

  const frage = useCallback(async () => {
    if (!kundenId) return;
    try {
      const a = await fetch(`${PROXY_BASE}?action=live_status&kundenId=${encodeURIComponent(kundenId)}&_cb=${Date.now()}`, { cache: 'no-store' });
      const d = await a.json();
      setSpiele(d && d.laeuft && Array.isArray(d.spiele) ? d.spiele : []);
    } catch {
      // Netz weg: letzten Stand behalten, nächste Minute neu fragen.
    }
  }, [kundenId]);

  useEffect(() => {
    frage();
    const takt = setInterval(() => { if (!document.hidden) frage(); }, ABFRAGE_MS);
    const sichtbar = () => { if (!document.hidden) frage(); };
    document.addEventListener('visibilitychange', sichtbar);
    return () => { clearInterval(takt); document.removeEventListener('visibilitychange', sichtbar); };
  }, [frage]);

  // Beim Öffnen sofort frisch fragen (sonst bis zu 1 Minute alt).
  const oeffnen = () => { setOffen(true); frage(); };
  const schliessen = () => setOffen(false);

  const laeuft = spiele.length > 0;
  const titel = laeuft ? t('live_jetzt', 'Jetzt live') : t('live_titel', 'Live');
  const zuschauerUrl = `${LIVE_BASIS}/zuschauer.html?verein=${encodeURIComponent(kundenId)}`
    + (spiele.length === 1 ? `&kanal=${encodeURIComponent(spiele[0].kanal)}` : '');
  const flaeche = akzent?.flaeche || themaFarbe || '#111111';
  const schrift = akzent?.schrift || 'white';

  return (
    <>
      <style>{STIL}</style>
      <button
        type="button"
        className={'onlang-live-zeichen' + (laeuft ? ' an' : '')}
        onClick={oeffnen}
        aria-label={laeuft ? t('live_jetzt', 'Jetzt live') : t('live_titel', 'Live')}
        title={laeuft ? t('live_jetzt', 'Jetzt live') : t('live_titel', 'Live')}
      >
        <span className="punkt" />LIVE
      </button>
      {/* Portal: im Ionic-Kopf wäre position:fixed an die Kopfzeile gebunden */}
      {offen && ReactDOM.createPortal(
        <div style={s.huelle} onClick={schliessen}>
          <div style={s.karte} role="dialog" aria-label={titel} onClick={(e) => e.stopPropagation()}>
            <div style={s.kopf}>
              <h3 style={s.titel}>{laeuft ? '🔴 ' : '🎥 '}{titel}</h3>
              <button onClick={schliessen} style={s.zu} aria-label="×">×</button>
            </div>
            {laeuft
              ? spiele.map((sp) => <p key={sp.kanal} style={s.laeuft}>{spielZeile(sp)}</p>)
              : <p style={s.still}>{t('live_kein_spiel', 'Gerade läuft kein Spiel. Sie können die Seite trotzdem öffnen – das Bild erscheint, sobald die Übertragung beginnt.')}</p>}
            <a href={zuschauerUrl} target="_blank" rel="noopener noreferrer" onClick={schliessen}
              style={{ ...s.knopf, background: laeuft ? '#e10600' : flaeche, color: laeuft ? 'white' : schrift, border: 'none' }}>
              ▶ {t('btn_live_zuschauen', 'Zuschauen')}
            </a>
            <p style={{ ...s.klein, marginBottom: 14 }}>{t('live_zuschauen_hinweis', 'Ohne Anmeldung, für alle.')}</p>
            <a href={`${LIVE_BASIS}/bedienfeld.html`} target="_blank" rel="noopener noreferrer" onClick={schliessen}
              style={{ ...s.knopf, background: 'white', color: '#222', border: '2px solid #ccc' }}>
              🎥 {t('btn_live_kamera', 'Kamera starten')}
            </a>
            <p style={s.klein}>{t('live_kamera_hinweis', 'Nur für den Verein: Anmeldung mit dem Live-Zugang.')}</p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default LiveZeichen;
