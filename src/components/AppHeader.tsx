// src/components/AppHeader.tsx
import React, { useLayoutEffect, useRef } from 'react';
import {
  IonHeader, IonToolbar, IonTitle,
  IonButtons, IonButton, IonIcon, IonSpinner,
} from '@ionic/react';
import { refreshOutline, settingsOutline } from 'ionicons/icons';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../i18n/LanguageSwitcher';

interface AppHeaderProps {
  title: string;
  logoUrl?: string;
  sponsorLogoUrl?: string;
  themaFarbe?: string;
  onRefresh?: () => void | Promise<void>;
  loading?: boolean;
  onAdminClick?: () => void;
}

const s: Record<string, React.CSSProperties> = {
  startSlot: { display: 'flex', alignItems: 'center', paddingLeft: 6 },
  logo: { height: 44, width: 44, objectFit: 'contain', borderRadius: 12, background: 'rgba(255,255,255,0.15)' },
  // fontSize setzt useTitelEinpassen; Innenabstand kleiner als Ionic-Standard
  // (20px), damit der Vereinsname im Hochformat mehr Platz hat.
  title: { color: 'white', fontWeight: 700, paddingLeft: 8, paddingRight: 8 },
  endSlot: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 4 },
  partnerLabel: { fontSize: '0.5rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '1px' },
  sponsorLogo: { height: 28, width: 44, objectFit: 'contain', background: 'white', borderRadius: 4, padding: 2 },
  refreshBtn: { color: 'white' },
  adminBtn: { color: 'rgba(255,255,255,0.75)' },
};

const TITEL_MAX_PX = 17.6; // bisher 1.1rem
const TITEL_MIN_PX = 11;

// Verkleinert die Titelschrift schrittweise, bis der Text in den verfuegbaren
// Platz passt (min. TITEL_MIN_PX, darunter kuerzt Ionic mit "…"). Reagiert
// auf Drehen und Groessenaenderungen.
function useTitelEinpassen(title: string) {
  const titleRef = useRef<HTMLIonTitleElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const titel = titleRef.current;
    const text = textRef.current;
    if (!titel || !text) return;

    const einpassen = () => {
      const stil = getComputedStyle(titel);
      // Exakte (nicht gerundete) Breiten, 1px Sicherheitsabstand - sonst
      // kuerzt Ionic schon bei Bruchteilen eines Pixels mit "…".
      const verfuegbar =
        titel.getBoundingClientRect().width - parseFloat(stil.paddingLeft) - parseFloat(stil.paddingRight) - 1;
      const zuBreit = () => text.getBoundingClientRect().width > verfuegbar;
      let groesse = TITEL_MAX_PX;
      titel.style.fontSize = `${groesse}px`;
      while (groesse - 0.5 >= TITEL_MIN_PX && zuBreit()) {
        groesse -= 0.5;
        titel.style.fontSize = `${groesse}px`;
      }
    };

    einpassen();
    const beobachter = new ResizeObserver(einpassen);
    beobachter.observe(titel);
    return () => beobachter.disconnect();
  }, [title]);

  return { titleRef, textRef };
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title, logoUrl, sponsorLogoUrl, themaFarbe, onRefresh, loading, onAdminClick
}) => {
  const { t } = useLanguage();
  const { titleRef, textRef } = useTitelEinpassen(title);
  return (
    <IonHeader>
      <IonToolbar style={{ '--background': themaFarbe || '#C4161C' } as React.CSSProperties}>
        <div slot="start" style={s.startSlot}>
          {logoUrl && <img src={logoUrl} alt="Logo" style={s.logo} />}
        </div>
        <IonTitle ref={titleRef} style={s.title}><span ref={textRef}>{title}</span></IonTitle>
        <IonButtons slot="end">
          <div style={{ marginRight: 8 }}>
            <LanguageSwitcher variant="light" />
          </div>
          {sponsorLogoUrl && (
            <div style={s.endSlot}>
              <span style={s.partnerLabel}>{t('lbl_partner', 'PARTNER')}</span>
              <img src={sponsorLogoUrl} alt="Sponsor" style={s.sponsorLogo} />
            </div>
          )}
          {onAdminClick && (
            <IonButton onClick={onAdminClick} style={s.adminBtn} title={t('lbl_admin_tooltip', 'Admin')}>
              <IonIcon icon={settingsOutline} />
            </IonButton>
          )}
          <IonButton onClick={() => onRefresh?.()} disabled={loading} style={s.refreshBtn}>
            {loading ? <IonSpinner name="crescent" /> : <IonIcon icon={refreshOutline} />}
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};

export default AppHeader;
