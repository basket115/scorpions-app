// src/App.tsx — Scorpions v3: Zahnrad immer sichtbar + Team-Login
import React, { useState, useEffect, createContext } from 'react';
import { IonApp } from '@ionic/react';
import Tab1 from './pages/Tab1';
import { useLanguage } from './i18n/LanguageContext';
import LanguageSwitcher from './i18n/LanguageSwitcher';
import { resolveCustomerId, noCustomerText } from './utils/customer';
import { appSymbol, logoOhneRand } from './utils/logo';
import { akzentFarben } from './utils/akzentfarbe';
import { anmelden, abmelden, hatSitzung, loginKopf, passwortVergessenAdresse } from './utils/vereinsLogin';

export const BrandingContext = createContext<any>(null);

const API_EXEC_URL =
 "/api/proxy";

export function fixGoogleDriveUrl(url: string): string {
  if (!url) return url;
  const match = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
  if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  return url;
}

function initOneSignal(appId: string, kundenId: string) {
  if (!appId) return;

  (window as any).OneSignalDeferred =
    (window as any).OneSignalDeferred || [];

  (window as any).OneSignalDeferred.push(
    async function (OneSignal: any) {
      await OneSignal.init({ appId });

      if (kundenId) {
        await OneSignal.User.addTag('Kunden-ID', kundenId);
      }
    }
  );
}

const PasswordInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  onEnter?: () => void;
  placeholder?: string;
}> = ({ value, onChange, onEnter, placeholder }) => {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder ?? t('login_password_placeholder', 'Passwort eingeben')}
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        onKeyDown={(e: any) => e.key === 'Enter' && onEnter && onEnter()}
        style={{ width: '100%', padding: '13px 48px 13px 16px', borderRadius: 10, border: 'none', fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box' as const }}
      />
      <button onClick={() => setShow(s => !s)} type="button" tabIndex={-1}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 1 }}>
        {show ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
    </div>
  );
};

const App: React.FC = () => {
  const { t: languageT, setLang, lang } = useLanguage();
  const [branding, setBranding] = useState<any>(null);
  const [bootstrapData, setBootstrapData] = useState<any>(null);
 const [uebersetzungen, setUebersetzungen] = useState<Record<string, string>>({});

const t = (key: string, fallback?: string): string => {
  const apiText = uebersetzungen[key];

  if (apiText != null && apiText !== '') {
    return apiText;
  }

  return languageT(key, fallback);
};
  const [loading, setLoading] = useState(true);

  const [teamRolle, setTeamRolle] = useState<'admin' | 'team' | null>(null);
  const [teamMannschaft, setTeamMannschaft] = useState('');
  const [teamId, setTeamId] = useState('');
  const [showTeamLogin, setShowTeamLogin] = useState(false);
  const [teamLoginDone, setTeamLoginDone] = useState(false);
  const [teamPassword, setTeamPassword] = useState('');
  const [teamError, setTeamError] = useState('');
  const [teamLoading, setTeamLoading] = useState(false);
  const [hasTeamLogin, setHasTeamLogin] = useState<boolean | null>(null);
  // Anmeldung im Zahnrad: 'email' (ein Login für Admin, Studio und App) oder
  // 'alt' (App-Passwort aus team_zugaenge, nur Vereine, die es noch haben).
  const [anmeldeWeg, setAnmeldeWeg] = useState<'email' | 'alt'>('email');
  const [loginEmail, setLoginEmail] = useState('');

  const resolvedKunde = resolveCustomerId();
  const kundenId = resolvedKunde || '';

  const applyBranding = (brandingData: any) => {
    setBranding(brandingData);
    const brandingSprache = String(
      brandingData?.Sprache || 'de'
    ).toLowerCase();

    const sprache: 'de' | 'hu' | 'en' =
      brandingSprache === 'hu' || brandingSprache === 'en'
        ? brandingSprache
        : 'de';

    setLang(sprache);
    setUebersetzungen({});

    const vereinName = brandingData?.Verein_Name || 'Sport App';
    // Kurzname (Supabase short_name) fuer Stellen mit wenig Platz, sonst voller Name.
    const kurzName = brandingData?.Short_Name || vereinName;
    const themaFarbe = brandingData?.Thema_Farbe || '#111111';
    const logoUrl = brandingData?.Logo_Verein || brandingData?.Logo_verein || '';
    // iPhone-Startbildschirm: eigenes quadratisches App-Icon, sonst daraus
    // erzeugtes Symbol (Cloudinary), sonst Vereinslogo.
    const appIconUrl = brandingData?.App_Icon_192 || brandingData?.App_Icon_512 || appSymbol(logoUrl, 192) || logoUrl;
    document.title = vereinName;

    const appleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleMeta) appleMeta.setAttribute('content', kurzName);

    let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', themaFarbe);
    } else {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      themeColorMeta.content = themaFarbe;
      document.head.appendChild(themeColorMeta);
    }

    if (logoUrl) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) favicon.href = logoUrl;
    }
    if (appIconUrl) {
      const appleFavicon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
      if (appleFavicon) appleFavicon.href = appIconUrl;
    }
  };

  // Push in Version 1 bewusst deaktiviert
const osAppId = '';

  const loadBootstrap = async () => {
    if (!resolvedKunde) { setLoading(false); return; }
    setLoading(true);

    try {
      const res = await fetch(`${API_EXEC_URL}?action=get_bootstrap&kundenId=${encodeURIComponent(kundenId)}`);
      const data = await res.json();

      if (data?.success && data?.branding) {
        setBootstrapData(data);
        applyBranding(data.branding);
        return;
      }

      throw new Error(data?.error || 'Bootstrap konnte nicht geladen werden');
    } catch (bootstrapErr) {
      console.warn('[Bootstrap] Fallback auf get_branding', bootstrapErr);
      setBootstrapData(null);

      try {
        const res = await fetch(`${API_EXEC_URL}?action=get_branding&kundenId=${encodeURIComponent(kundenId)}`);
        const data = await res.json();
        if (data?.success && data?.branding) applyBranding(data.branding);
      } catch (brandingErr) {
        console.error(brandingErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBootstrap(); }, []); // eslint-disable-line

  useEffect(() => {
    if (!kundenId) { setHasTeamLogin(false); return; }
    // Nur die Rollen annehmen, die es gibt - jeder andere gespeicherte Wert gilt als nicht angemeldet.
    const gespeichert = sessionStorage.getItem('teamRolle');
    const savedRolle = gespeichert === 'admin' || gespeichert === 'team' ? gespeichert : null;
    const savedKundenId = sessionStorage.getItem('teamKundenId') || '';
    if (savedRolle && savedKundenId === kundenId) {
      setTeamRolle(savedRolle);
      setTeamMannschaft(sessionStorage.getItem('teamMannschaft') || '');
      setTeamId(sessionStorage.getItem('teamId') || '');
      setTeamLoginDone(true);
      setHasTeamLogin(true);
    } else {
      setHasTeamLogin(false);
      if (hatSitzung()) emailRolleUebernehmen(true);
    }
  }, [kundenId]); // eslint-disable-line

  const checkHasTeamLogin = async () => {
    try {
      const res = await fetch(`${API_EXEC_URL}?action=checkTeamLogin&kundenId=${encodeURIComponent(kundenId)}`);
      const data = await res.json();
     if (data.hasTeamLogin) { setHasTeamLogin(true); }
      else { setHasTeamLogin(false); }
    } catch { setHasTeamLogin(false); }
  };
useEffect(() => {
  if (kundenId) {
    checkHasTeamLogin();
  }
}, [kundenId]);
  const reload = () => loadBootstrap();

const handleTeamLogin = async () => {
  if (!teamPassword.trim()) return;

  setTeamLoading(true);
  setTeamError('');

  try {
    const res = await fetch(
      `${API_EXEC_URL}?action=getTeamRole&kundenId=${encodeURIComponent(kundenId)}&password=${encodeURIComponent(teamPassword)}`
    );

    const data = await res.json();

    if (data.success) {
      sessionStorage.setItem('teamRolle', data.rolle);
      sessionStorage.setItem('teamMannschaft', data.mannschaft);
      sessionStorage.setItem('teamId', data.team_id);
      sessionStorage.setItem('teamKundenId', kundenId);
      // Wird beim Speichern von Beitraegen mitgeschickt und serverseitig geprueft.
      sessionStorage.setItem('teamPasswort', teamPassword);

      // Aktuelle Beiträge/Sponsoren neu holen,
      // damit nach einem Rollenwechsel kein alter Bootstrap-Stand angezeigt wird.
      await loadBootstrap();

      setTeamRolle(data.rolle);
      setTeamMannschaft(data.mannschaft);
      setTeamId(data.team_id);
      setTeamLoginDone(true);
      setShowTeamLogin(false);
      setTeamPassword('');

    } else {
      setTeamError(
        t('error_falsches_passwort', 'Falsches Passwort!')
      );
    }

  } catch {
    setTeamError(
      t('error_verbindungsfehler', 'Verbindungsfehler')
    );
  }

  setTeamLoading(false);
};

  // Fragt den App-Server, ob der E-Mail-Login zu diesem Verein gehört, und
  // übernimmt die Rolle. still = beim Start (dann ohne Fehlermeldung).
  const emailRolleUebernehmen = async (still: boolean): Promise<boolean> => {
    try {
      const res = await fetch(`${API_EXEC_URL}?action=emailRolle&kundenId=${encodeURIComponent(kundenId)}`, {
        method: 'POST',
        headers: await loginKopf(),
      });
      const data = await res.json();
      if (data.success && (data.rolle === 'admin' || data.rolle === 'team')) {
        sessionStorage.setItem('teamRolle', data.rolle);
        sessionStorage.setItem('teamMannschaft', '');
        sessionStorage.setItem('teamId', '');
        sessionStorage.setItem('teamKundenId', kundenId);
        sessionStorage.setItem('anmeldeArt', 'email');
        sessionStorage.removeItem('teamPasswort');
        setTeamRolle(data.rolle);
        setTeamMannschaft('');
        setTeamId('');
        setTeamLoginDone(true);
        setShowTeamLogin(false);
        return true;
      }
      if (!still) {
        const code = String(data.code || '');
        setTeamError(
          code === 'anderer_verein' ? t('error_anderer_verein', 'Dieses Login gehört zu einem anderen Verein.')
          : code === 'gesperrt' ? t('error_testphase_beendet', 'Ihre Testphase ist beendet.')
          : t('error_kein_zugang_app', 'Für dieses Login ist kein Zugang freigeschaltet.')
        );
      }
      await abmelden();
      return false;
    } catch {
      if (!still) setTeamError(t('error_verbindungsfehler', 'Verbindungsfehler'));
      return false;
    }
  };

  const handleEmailLogin = async () => {
    if (!loginEmail.trim() || !teamPassword) return;
    setTeamLoading(true);
    setTeamError('');
    try {
      const ok = await anmelden(loginEmail, teamPassword);
      if (!ok) {
        setTeamError(t('error_login_email', 'E-Mail oder Passwort stimmt nicht.'));
      } else if (await emailRolleUebernehmen(false)) {
        setTeamPassword('');
        await loadBootstrap();
      }
    } catch {
      setTeamError(t('error_verbindungsfehler', 'Verbindungsfehler'));
    }
    setTeamLoading(false);
  };

  const handleTeamLogout = () => {
    sessionStorage.removeItem('teamRolle'); sessionStorage.removeItem('teamMannschaft');
    sessionStorage.removeItem('teamId'); sessionStorage.removeItem('teamKundenId');
    sessionStorage.removeItem('teamPasswort'); sessionStorage.removeItem('anmeldeArt');
    abmelden();
    setTeamRolle(null); setTeamMannschaft(''); setTeamId('');
    setTeamLoginDone(false); setShowTeamLogin(true);
  };

  const isReadOnly = String(branding?.ReadOnly || '').toUpperCase() === 'TRUE';
  const showGear = !isReadOnly;

  const themaFarbe = branding?.Thema_Farbe || '#111111';
  // Einloggen-Knopf: mit Akzentfarbe wie die Website-Knöpfe, sonst weiß wie bisher.
  const akzent = akzentFarben(themaFarbe, branding?.Akzent_Farbe);
  const logoUrl = branding?.Logo_verein || branding?.Logo_Verein || '';
  // Anmeldebildschirm: Vereinslogo (wie Kopfzeile und Website), nur ohne
  // Logo das eigene App-Icon.
  const loginBildUrl = logoUrl || branding?.App_Icon_512 || branding?.App_Icon_192 || '';

if (!resolvedKunde) {
  const l = (
    new URLSearchParams(window.location.search).get('lang') || 'de'
  ).toLowerCase();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#111',
        padding: 24,
        textAlign: 'center'
      }}
    >
      <div
        style={{
          color: 'white',
          fontSize: 18,
          maxWidth: 320
        }}
      >
        {noCustomerText(l)}
      </div>
    </div>
  );
}

if (loading && !branding) {
  return (
    <IonApp>
      <div
        style={{
          minHeight: '100vh',
          background: '#111111',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            fontSize: 34,
            fontWeight: 900,
            letterSpacing: 3,
            color: '#ffffff',
            marginBottom: 18
          }}
        >
          ONLANG
        </div>

        <div
          style={{
            width: 34,
            height: 34,
            border: '4px solid rgba(255,255,255,0.25)',
            borderTopColor: '#ffffff',
            borderRadius: '50%',
            animation: 'onlang-spin 0.8s linear infinite'
          }}
        />

        <div
          style={{
            marginTop: 18,
            color: 'rgba(255,255,255,0.75)',
            fontSize: 15
          }}
        >
          App wird geladen…
        </div>

        <style>
          {`
            @keyframes onlang-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </IonApp>
  );
}

// Ab hier ist Branding vorhanden.
// Jetzt erst die echte Vereins-App bzw. Login-Ansicht anzeigen.

 if (showTeamLogin && !teamLoginDone) {
    return (
      <IonApp>
        <div style={{ minHeight: '100vh', background: themaFarbe, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 16, left: 16 }}>
            <LanguageSwitcher variant="light" />
          </div>
          <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            {loginBildUrl && <div style={{ width: 100, height: 100, borderRadius: 20, overflow: 'hidden', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
              <img src={logoOhneRand(loginBildUrl)} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => { if (e.currentTarget.src !== loginBildUrl) e.currentTarget.src = loginBildUrl; }} />
            </div>}
            <h2 style={{ color: 'white', fontWeight: 900, fontSize: 28, margin: 0, textAlign: 'center' }}>{branding?.Verein_Name || 'Sport App'}</h2>
            {anmeldeWeg === 'email' ? (<>
              <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: 14, textAlign: 'center' }}>{t('hinweis_email_login', 'Mit derselben E-Mail-Adresse und demselben Passwort wie im Studio und im Admin.')}</p>
              <input type="email" autoComplete="username" value={loginEmail} onChange={(e: any) => setLoginEmail(e.target.value)}
                placeholder={t('login_email_placeholder', 'E-Mail-Adresse')}
                style={{ width: '100%', padding: '13px 16px', borderRadius: 10, border: 'none', fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
              <PasswordInput value={teamPassword} onChange={setTeamPassword} onEnter={handleEmailLogin} placeholder={t('login_passwort_placeholder', 'Passwort')} />
            </>) : (<>
              <p style={{ color: 'rgba(255,255,255,0.65)', margin: 0, fontSize: 14 }}>{t('hinweis_team_login', 'Bitte mit Ihrem Team-Passwort anmelden.')}</p>
              <PasswordInput value={teamPassword} onChange={setTeamPassword} onEnter={handleTeamLogin} />
            </>)}
            {teamError && <p style={{ color: '#ffcccc', margin: 0, fontSize: 14 }}>{teamError}</p>}
            <button onClick={anmeldeWeg === 'email' ? handleEmailLogin : handleTeamLogin} disabled={teamLoading}
              style={{ width: '100%', padding: 13, borderRadius: 10, border: 'none', background: akzent.aktiv ? akzent.flaeche : 'white', color: akzent.aktiv ? akzent.schrift : themaFarbe, fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', opacity: teamLoading ? 0.7 : 1 }}>
              {teamLoading ? t('btn_login_laeuft', 'Einloggen...') : t('btn_login', 'Einloggen')}
            </button>
            <button onClick={() => { setShowTeamLogin(false); setTeamLoginDone(true); }}
              style={{ width: '100%', padding: 11, borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: 'white', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
              {t('btn_weiter_ohne_login', 'Weiter ohne Login →')}
            </button>
            {anmeldeWeg === 'email' && (
              <a href={passwortVergessenAdresse(lang)} target="_blank" rel="noopener noreferrer"
                style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{t('btn_passwort_vergessen', 'Passwort vergessen?')}</a>
            )}
            {hasTeamLogin && (
              <button type="button" onClick={() => { setAnmeldeWeg(anmeldeWeg === 'email' ? 'alt' : 'email'); setTeamError(''); setTeamPassword(''); }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.65)', fontSize: 13, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}>
                {anmeldeWeg === 'email' ? t('btn_alter_zugang', 'Alter Zugang mit App-Passwort') : t('btn_email_zugang', 'Zurück zur Anmeldung mit E-Mail')}
              </button>
            )}
          </div>
        </div>
      </IonApp>
    );
  }

  return (
    <BrandingContext.Provider value={{
     t,
sprache: String(branding?.Sprache || 'de').toLowerCase(),
      branding,
      bootstrapData,
      loading,
      reload,
      teamRolle,
      teamMannschaft,
      teamId,
      teamLoginDone,
      handleTeamLogout,
      // ★ NEU: Social URLs direkt aus Branding-Daten mappen
      webUrl:       branding?.WEB_URL       || branding?.webUrl       || '',
      facebookUrl:  branding?.Facebook_URL  || branding?.facebookUrl  || '',
      instagramUrl: branding?.Instagram_URL || branding?.Instragram_URL || branding?.instagramUrl || '',
      youtubeUrl:   branding?.Youtube_URL   || branding?.youtubeUrl   || '',
      tiktokUrl:    branding?.TikTok_URL    || branding?.tiktokUrl    || '',
      whatsappUrl:  branding?.WhatsApp_URL  || branding?.Whatsapp_URL || branding?.whatsappUrl  || '', // ★ NEU
    }}>
      <IonApp>
        <Tab1
  onAdminClick={
    // Zahnrad bei jedem Verein (außer "nur lesen"): Anmeldung mit E-Mail +
    // Passwort, bei Vereinen mit App-Passwort zusätzlich der alte Weg.
    showGear
      ? () => {
          setShowTeamLogin(true);
          setTeamLoginDone(false);
        }
      : undefined
  }
/>
      </IonApp>
    </BrandingContext.Provider>
  );
};

export default App;
