// src/components/AppHeader.tsx
import React, { useLayoutEffect, useRef } from 'react';
import {
  IonHeader, IonToolbar, IonTitle,
  IonButtons, IonButton, IonIcon, IonSpinner,
} from '@ionic/react';
import { refreshOutline, settingsOutline } from 'ionicons/icons';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../i18n/LanguageSwitcher';
import { logoOhneRand } from '../utils/logo';
import InstallKnopf from './InstallKnopf';

interface AppHeaderProps {
  title: string;
  logoUrl?: string;
  logoHintergrund?: string;
  sponsorLogoUrl?: string;
  themaFarbe?: string;
  onRefresh?: () => void | Promise<void>;
  loading?: boolean;
  onAdminClick?: () => void;
}

const s: Record<string, React.CSSProperties> = {
  startSlot: { display: 'flex', alignItems: 'center', paddingLeft: 6 },
  // Wie Template 7 (.brand-logo am Handy): 48px, Ecken 14px, 1px Innenrand.
  logo: { height: 48, width: 48, objectFit: 'contain', borderRadius: 14, padding: 1, boxSizing: 'border-box' },
  // fontSize setzt useTitelEinpassen; Innenabstand kleiner als Ionic-Standard
  // (20px), damit der Vereinsname im Hochformat mehr Platz hat.
  title: { color: 'white', fontWeight: 700, paddingLeft: 8, paddingRight: 8 },
  endSlot: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 4 },
  partnerLabel: { fontSize: '0.5rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '1px' },
  sponsorLogo: { height: 28, width: 44, objectFit: 'contain', background: 'white', borderRadius: 4, padding: 2 },
  refreshBtn: { color: 'white' },
  adminBtn: { color: 'rgba(255,255,255,0.75)' },
};

// Logo-Hintergrund wie auf der Website (kunden.logo_hintergrund): leer = hell.
const LOGO_HINTERGRUND: Record<string, string> = { dunkel: '#111114', ohne: 'transparent' };
function logoHintergrundFarbe(wert?: string): string {
  return LOGO_HINTERGRUND[String(wert || '').trim().toLowerCase()] || '#fff';
}

const TITEL_MAX_PX = 17.6; // bisher 1.1rem
const TITEL_MIN_PX = 11;
// Einzeilig nicht kleiner als das; sonst lieber zwei Zeilen (lange Namen am Handy)
const TITEL_EINZEILIG_MIN_PX = 13;
const TITEL_ZWEIZEILIG_MAX_PX = 15;
const TITEL_ZEILENHOEHE = 1.15;

// Zwei Zeilen fuer den Namen ein-/ausschalten (am Span, die Ionic-Huelle
// bleibt unveraendert).
function zweiZeilen(text: HTMLSpanElement, an: boolean) {
  const st = text.style as CSSStyleDeclaration & { webkitLineClamp: string; webkitBoxOrient: string };
  st.whiteSpace = an ? 'normal' : '';
  st.display = an ? '-webkit-box' : '';
  st.webkitLineClamp = an ? '2' : '';
  st.webkitBoxOrient = an ? 'vertical' : '';
  st.overflow = an ? 'hidden' : '';
  st.lineHeight = an ? String(TITEL_ZEILENHOEHE) : '';
}

// Verkleinert die Titelschrift schrittweise, bis der Text in eine Zeile passt
// (bis TITEL_EINZEILIG_MIN_PX). Passt er dann noch nicht, bricht er auf zwei
// Zeilen um (ab TITEL_ZWEIZEILIG_MAX_PX kleiner bis TITEL_MIN_PX, darunter
// kuerzt er mit "…"). Reagiert auf Drehen und Groessenaenderungen.
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
      zweiZeilen(text, false);
      let groesse = TITEL_MAX_PX;
      titel.style.fontSize = `${groesse}px`;
      while (groesse - 0.5 >= TITEL_EINZEILIG_MIN_PX && zuBreit()) {
        groesse -= 0.5;
        titel.style.fontSize = `${groesse}px`;
      }
      if (!zuBreit()) return;

      // Zwei Zeilen: kleiner, bis der Name in zwei Zeilen passt und kein
      // Wort breiter ist als der Platz.
      zweiZeilen(text, true);
      const zuGross = () =>
        text.scrollHeight > groesse * TITEL_ZEILENHOEHE * 2 + 1 || text.scrollWidth > text.clientWidth + 1;
      groesse = TITEL_ZWEIZEILIG_MAX_PX;
      titel.style.fontSize = `${groesse}px`;
      while (groesse - 0.5 >= TITEL_MIN_PX && zuGross()) {
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
  title, logoUrl, logoHintergrund, sponsorLogoUrl, themaFarbe, onRefresh, loading, onAdminClick
}) => {
  const { t } = useLanguage();
  const { titleRef, textRef } = useTitelEinpassen(title);
  return (
    <IonHeader>
      <IonToolbar style={{ '--background': themaFarbe || '#C4161C' } as React.CSSProperties}>
        <div slot="start" style={s.startSlot}>
          {logoUrl && (
            <img
              src={logoOhneRand(logoUrl)}
              alt="Logo"
              style={{ ...s.logo, background: logoHintergrundFarbe(logoHintergrund) }}
              // Beschnittenes Bild nicht ladbar: Original zeigen.
              onError={(e) => { if (e.currentTarget.src !== logoUrl) e.currentTarget.src = logoUrl; }}
            />
          )}
        </div>
        <IonTitle ref={titleRef} style={s.title}><span ref={textRef}>{title}</span></IonTitle>
        <IonButtons slot="end">
          <InstallKnopf themaFarbe={themaFarbe} />
          <div style={{ marginRight: 6 }}>
            <LanguageSwitcher variant="light" kompakt />
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
