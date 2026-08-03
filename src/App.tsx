// src/App.tsx — Scorpions v3: Zahnrad immer sichtbar + Team-Login
import React, { useState, useEffect, createContext } from 'react';
import { IonApp } from '@ionic/react';
import Tab1 from './pages/Tab1';
import { useLanguage } from './i18n/LanguageContext';
import LanguageSwitcher from './i18n/LanguageSwitcher';
import { resolveCustomerId, noCustomerText } from './utils/customer';

export const BrandingContext = createContext<any>(null);

const API_EXEC_URL =
 "/api/proxy";

export function fixGoogleDriveUrl(url: string): string {
  if (!url) return url;
  const match = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
  if (match) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  return url;
}

function initOneSignal(appId: string) {
  if (!appId) return;
  (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
  (window as any).OneSignalDeferred.push(async function (OneSignal: any) {
    await OneSignal.init({ appId });
  });
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
  const { t: languageT, setLang } = useLanguage();
  const [branding, setBranding] = useState<any>(null);
 const [uebersetzungen, setUebersetzungen] = useState<Record<string, string>>({});

const t = (key: string, fallback?: string): string => {
  const apiText = uebersetzungen[key];

  if (apiText != null && apiText !== '') {
    return apiText;
  }

  return languageT(key, fallback);
};
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [error, setError] = useState('');

  const [teamRolle, setTeamRolle] = useState<'admin' | 'abtl' | 'team' | null>(null);
  const [teamMannschaft, setTeamMannschaft] = useState('');
  const [teamId, setTeamId] = useState('');
  const [showTeamLogin, setShowTeamLogin] = useState(false);
  const [teamLoginDone, setTeamLoginDone] = useState(false);
  const [teamPassword, setTeamPassword] = useState('');
  const [teamError, setTeamError] = useState('');
  const [teamLoading, setTeamLoading] = useState(false);
  const [hasTeamLogin, setHasTeamLogin] = useState<boolean | null>(null);

  const resolvedKunde = resolveCustomerId();
  const kundenId = resolvedKunde || '';

  const loadBranding = async () => {
    if (!resolvedKunde) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_EXEC_URL}?action=get_branding&kundenId=${kundenId}`);
      const data = await res.json();
      if (data.success) {
        setBranding(data.branding);
       const brandingSprache = String(
  data.branding?.Sprache || 'de'
).toLowerCase();

const sprache: 'de' | 'hu' | 'en' =
  brandingSprache === 'hu' || brandingSprache === 'en'
    ? brandingSprache
    : 'de';

setLang(sprache);

try {
  const translationsRes = await fetch(
    `${API_EXEC_URL}?action=getTranslations&kundenId=${encodeURIComponent(kundenId)}&lang=${encodeURIComponent(sprache)}`
  );

  const translationsData = await translationsRes.json();

  if (translationsData?.translations) {
    setUebersetzungen(translationsData.translations);
  } else {
    setUebersetzungen({});
  }
} catch {
  setUebersetzungen({});
}
        const vereinName = data.branding?.Verein_Name || 'Sport App';
        const themaFarbe = data.branding?.Thema_Farbe || '#111111';
        const logoUrl = data.branding?.Logo_Verein || data.branding?.Logo_verein || '';
        document.title = vereinName;
        const appleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
        if (appleMeta) appleMeta.setAttribute('content', vereinName);
        let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
        if (themeColorMeta) { themeColorMeta.setAttribute('content', themaFarbe); }
        else { themeColorMeta = document.createElement('meta'); themeColorMeta.name = 'theme-color'; themeColorMeta.content = themaFarbe; document.head.appendChild(themeColorMeta); }
        if (logoUrl) {
          const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
          const appleFavicon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
          if (favicon) favicon.href = logoUrl;
          if (appleFavicon) appleFavicon.href = logoUrl;
        }
        const osAppId = data.branding?.OneSignal_App_ID || '';
        if (osAppId) initOneSignal(osAppId);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { loadBranding(); }, []); // eslint-disable-line

  useEffect(() => {
    if (!kundenId) { setHasTeamLogin(false); return; }
    const savedRolle = sessionStorage.getItem('teamRolle') as 'admin' | 'abtl' | 'team' | null;
    const savedKundenId = sessionStorage.getItem('teamKundenId') || '';
    if (savedRolle && savedKundenId === kundenId) {
      setTeamRolle(savedRolle);
      setTeamMannschaft(sessionStorage.getItem('teamMannschaft') || '');
      setTeamId(sessionStorage.getItem('teamId') || '');
      setTeamLoginDone(true);
      setHasTeamLogin(true);
    } else { checkHasTeamLogin(); }
  }, [kundenId]); // eslint-disable-line

  const checkHasTeamLogin = async () => {
    try {
      const res = await fetch(`${API_EXEC_URL}?action=checkTeamLogin&kundenId=${encodeURIComponent(kundenId)}`);
      const data = await res.json();
      if (data.hasTeamLogin) { setHasTeamLogin(true); setShowTeamLogin(true); }
      else { setHasTeamLogin(false); }
    } catch { setHasTeamLogin(false); }
  };

  const reload = () => loadBranding();

  const handleTeamLogin = async () => {
    if (!teamPassword.trim()) return;
    setTeamLoading(true); setTeamError('');
    try {
      const res = await fetch(`${API_EXEC_URL}?action=getTeamRole&kundenId=${encodeURIComponent(kundenId)}&password=${encodeURIComponent(teamPassword)}`);
      const data = await res.json();
      if (data.success) {
        setTeamRolle(data.rolle); setTeamMannschaft(data.mannschaft); setTeamId(data.team_id);
        setTeamLoginDone(true); setShowTeamLogin(false); setTeamPassword('');
        sessionStorage.setItem('teamRolle', data.rolle);
        sessionStorage.setItem('teamMannschaft', data.mannschaft);
        sessionStorage.setItem('teamId', data.team_id);
        sessionStorage.setItem('teamKundenId', kundenId);
      } else { setTeamError(t('error_falsches_passwort', 'Falsches Passwort!')); }
    } catch { setTeamError(t('error_verbindungsfehler', 'Verbindungsfehler')); }
    setTeamLoading(false);
  };

  const handleTeamLogout = () => {
    sessionStorage.removeItem('teamRolle'); sessionStorage.removeItem('teamMannschaft');
    sessionStorage.removeItem('teamId'); sessionStorage.removeItem('teamKundenId');
    setTeamRolle(null); setTeamMannschaft(''); setTeamId('');
    setTeamLoginDone(false); setShowTeamLogin(true);
  };

  const handleLogin = async () => {
    try {
      setError('');
      const res = await fetch(`${API_EXEC_URL}?kundenId=${encodeURIComponent(kundenId)}&password=${encodeURIComponent(password)}`);
      const data = await res.json();
      if (data.success) { setIsAuthenticated(true); setShowLogin(false); setPassword(''); }
      else { setError(data.error || t('error_falsches_passwort', 'Falsches Passwort!')); }
    } catch { setError(t('error_login_fehlgeschlagen', 'Login Fehler')); }
  };

  const isReadOnly = String(branding?.ReadOnly || '').toUpperCase() === 'TRUE';
  const showGear = !isReadOnly;

  const themaFarbe = branding?.Thema_Farbe || '#111111';
  const logoUrl = branding?.Logo_verein || branding?.Logo_Verein || '';

  if (!resolvedKunde) {
    const l = (new URLSearchParams(window.location.search).get('lang') || 'de').toLowerCase();
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#111', padding: 24, textAlign: 'center' }}>
        <div style={{ color: 'white', fontSize: 18, maxWidth: 320 }}>{noCustomerText(l)}</div>
      </div>
    );
  }

  // Render-Sperre entfernt: Der erste Bildschirm (Menü/Header) erscheint SOFORT.
  // Branding (ggf. aus Cache sofort), Übersetzungen, TeamLogin und Feed laden im
  // Hintergrund und füllen die UI nach – nichts davon blockiert den Start mehr.

  if (false && hasTeamLogin && showTeamLogin && !teamLoginDone) {
    return (
      <IonApp>
        <div style={{ minHeight: '100vh', background: themaFarbe, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 16, left: 16 }}>
            <LanguageSwitcher variant="light" />
          </div>
          {showGear && (
            <button onClick={() => setShowLogin(true)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, padding: 10, cursor: 'pointer', color: 'white' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
              </svg>
            </button>
          )}
          <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            {logoUrl && <div style={{ width: 100, height: 100, borderRadius: 20, overflow: 'hidden', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
              <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>}
            <h2 style={{ color: 'white', fontWeight: 900, fontSize: 28, margin: 0, textAlign: 'center' }}>{branding?.Verein_Name || 'Sport App'}</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', margin: 0, fontSize: 14 }}>{t('hinweis_team_login', 'Bitte mit deinem Team-Passwort einloggen')}</p>
            <PasswordInput value={teamPassword} onChange={setTeamPassword} onEnter={handleTeamLogin} />
            {teamError && <p style={{ color: '#ffcccc', margin: 0, fontSize: 14 }}>{teamError}</p>}
            <button onClick={handleTeamLogin} disabled={teamLoading}
              style={{ width: '100%', padding: 13, borderRadius: 10, border: 'none', background: 'white', color: themaFarbe, fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', opacity: teamLoading ? 0.7 : 1 }}>
              {teamLoading ? t('btn_login_laeuft', 'Einloggen...') : t('btn_login', 'Einloggen')}
            </button>
            <button onClick={() => { setShowTeamLogin(false); setTeamLoginDone(true); }}
              style={{ width: '100%', padding: 11, borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: 'white', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
              {t('btn_weiter_ohne_login', 'Weiter ohne Login →')}
            </button>
          </div>
        </div>
      </IonApp>
    );
  }

  if (showLogin && !isAuthenticated) {
    return (
      <IonApp>
        <div style={{ minHeight: '100vh', background: themaFarbe, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 16, left: 16 }}>
            <LanguageSwitcher variant="light" />
          </div>
          <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            {logoUrl && <div style={{ width: 100, height: 100, borderRadius: 20, overflow: 'hidden', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
              <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>}
            <h2 style={{ color: 'white', fontWeight: 900, fontSize: 28, margin: 0, textAlign: 'center' }}>{branding?.Verein_Name || t('lbl_admin_login', 'Admin Login')}</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', margin: 0, fontSize: 14 }}>{t('lbl_admin_login', 'Admin Login')}</p>
            <PasswordInput value={password} onChange={setPassword} onEnter={handleLogin} />
            {error && <p style={{ color: '#ffcccc', margin: 0, fontSize: 14 }}>{error}</p>}
            <button onClick={handleLogin}
              style={{ width: '100%', padding: 13, borderRadius: 10, border: 'none', background: 'white', color: themaFarbe, fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }}>
              {t('btn_login', 'Einloggen')}
            </button>
            <button onClick={() => { setShowLogin(false); setPassword(''); setError(''); }}
              style={{ width: '100%', padding: 11, borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: 'white', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
              {t('btn_zurueck_zur_app', '← Zurück zur App')}
            </button>
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
      loading,
      reload,
      isAuthenticated,
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
        <Tab1 onAdminClick={showGear ? () => setShowLogin(true) : undefined} />
      </IonApp>
    </BrandingContext.Provider>
  );
};

export default App;
