// src/components/InstallKnopf.tsx
// Symbol "App installieren" im Kopf (Logik in utils/pwa.ts).
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { IonButton, IonIcon } from '@ionic/react';
import { downloadOutline } from 'ionicons/icons';
import { useLanguage } from '../i18n/LanguageContext';
import { aktuelleInstallArt, beiAenderung, oeffneInstallFenster, InstallArt } from '../utils/pwa';

const s: Record<string, React.CSSProperties> = {
  knopf: { color: 'white' },
  huelle: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  karte: { background: 'white', color: '#222', borderRadius: 16, padding: 24, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  kopf: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  titel: { margin: 0, fontSize: 18, fontWeight: 700 },
  zu: { background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' },
  text: { margin: 0, fontSize: 15, lineHeight: 1.5 },
};

const InstallKnopf: React.FC<{ themaFarbe?: string }> = ({ themaFarbe }) => {
  const { t } = useLanguage();
  const [art, setArt] = useState<InstallArt>(() => aktuelleInstallArt());
  const [anleitung, setAnleitung] = useState(false);

  useEffect(() => beiAenderung(() => setArt(aktuelleInstallArt())), []);

  if (!art) return null;

  const klick = () => {
    if (art === 'fenster') oeffneInstallFenster();
    else setAnleitung(true);
  };
  const schliessen = () => setAnleitung(false);
  const titel = t('btn_app_installieren', 'App installieren');

  return (
    <>
      <IonButton onClick={klick} style={s.knopf} title={titel} aria-label={titel}>
        <IonIcon icon={downloadOutline} />
      </IonButton>
      {/* Portal: im Ionic-Kopf waere position:fixed an die Kopfzeile gebunden */}
      {anleitung && ReactDOM.createPortal(
        <div style={s.huelle} onClick={schliessen}>
          <div style={s.karte} role="dialog" aria-label={titel} onClick={(e) => e.stopPropagation()}>
            <div style={s.kopf}>
              <h3 style={s.titel}>{titel}</h3>
              <button onClick={schliessen} style={s.zu} aria-label="×">×</button>
            </div>
            <p style={s.text}>
              {art === 'ios'
                ? t('install_anleitung_ios', 'Tippen Sie auf das Teilen-Symbol und dann auf „Zum Home-Bildschirm“.')
                : art === 'inapp'
                  ? t('install_anleitung_inapp', 'Öffnen Sie diese Seite in Safari bzw. Chrome, um die App zu installieren.')
                  : t('install_anleitung_firefox', 'Tippen Sie auf das Menü (⋮) und dann auf „Installieren“.')}
            </p>
            <button onClick={schliessen} style={{ width: '100%', marginTop: 16, padding: 12, borderRadius: 10, border: 'none', background: themaFarbe || '#111111', color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              {t('btn_verstanden', 'Verstanden ✓')}
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default InstallKnopf;
