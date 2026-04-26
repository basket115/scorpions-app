// src/App.tsx — Scorpions v2: Augen-Symbol + ReadOnly-Fix + Drive-URL-Fix
import React, { useState, useEffect, createContext } from 'react';
import { IonApp } from '@ionic/react';
import Tab1 from './pages/Tab1';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import './theme/variables.css';

export const BrandingContext = createContext<any>(null);

const API_EXEC_URL =
  "https://script.google.com/macros/s/AKfycbwm0nO0XRsJD2gqWTbfZvRHdKTN0ylbJrWkJt66TcCCiBkX8l7aaV2lF5saHEBwwqeUoA/exec";

// ── Google Drive URL Auto-Konvertierung ───────────────────────
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

// ── Passwort-Input mit Augen-Symbol ───────────────────────────
const PasswordInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  onEnter?: () => void;
  placeholder?: string;
}> = ({ value, onChange, onEnter, placeholder = 'Passwort eingeben' }) => {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
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
  const [branding, setBranding] = useState<any>(null);
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

  const kundenId = (() => {
    const fromUrl = new URLSearchParams(window.location.search).get('kunde');
    if (fromUrl) { localStorage.setItem('kundenId', fromUrl); return fromUrl; }
    return localStorage.getItem('kundenId') || '';
  })();

  const loadBranding = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_EXEC_URL}?action=get_branding&kundenId=${kundenId}`);
      const data = await res.json();
      if (data.success) {
        setBranding(data.branding);
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

        const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
        if (manifestLink) {
          const manifest = {
            short_name: vereinName, name: vereinName + ' App',
            icons: [{ src: logoUrl || '/logo.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                    { src: logoUrl || '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }],
            start_url: '/?kunde=' + kundenId, display: 'standalone',
            background_color: themaFarbe, theme_color: themaFarbe
          };
          const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
          const oldUrl = manifestLink.href;
          manifestLink.href = URL.createObjectURL(blob);
          if (oldUrl.startsWith('blob:')) URL.revokeObjectURL(oldUrl);
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
      } else { setTeamError('Falsches Passwort'); }
    } catch { setTeamError('Verbindungsfehler'); }
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
      else { setError(data.error || 'Falsches Passwort!'); }
    } catch { setError('Login Fehler'); }
  };

  // ── ReadOnly-Check ────────────────────────────────────────
  const isReadOnly = String(branding?.ReadOnly || '').toUpperCase() === 'TRUE';
  const isAdmin = !isReadOnly;

  const themaFarbe = branding?.Thema_Farbe || '#111111';
  const logoUrl = branding?.Logo_verein || branding?.Logo_Verein || '';

  if (loading || hasTeamLogin === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#111' }}>
        <div style={{ color: 'white', fontSize: 18 }}>Laden...</div>
      </div>
    );
  }

  if (hasTeamLogin && showTeamLogin && !teamLoginDone) {
    return (
      <IonApp>
        <div style={{ minHeight: '100vh', background: themaFarbe, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            {logoUrl && <img src={logoUrl} alt="Logo" style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'contain', background: 'rgba(255,255,255,0.15)', padding: 8 }} />}
            <h2 style={{ color: 'white', fontWeight: 900, fontSize: 28, margin: 0, textAlign: 'center' }}>{branding?.Verein_Name || 'Sport App'}</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', margin: 0, fontSize: 14 }}>Bitte mit deinem Team-Passwort einloggen</p>
            <PasswordInput value={teamPassword} onChange={setTeamPassword} onEnter={handleTeamLogin} />
            {teamError && <p style={{ color: '#ffcccc', margin: 0, fontSize: 14 }}>{teamError}</p>}
            <button onClick={handleTeamLogin} disabled={teamLoading}
              style={{ width: '100%', padding: 13, borderRadius: 10, border: 'none', background: 'white', color: themaFarbe, fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', opacity: teamLoading ? 0.7 : 1 }}>
              {teamLoading ? 'Einloggen...' : 'Einloggen'}
            </button>
          </div>
        </div>
      </IonApp>
    );
  }

  if (isAdmin && showLogin && !isAuthenticated) {
    return (
      <IonApp>
        <div style={{ minHeight: '100vh', background: themaFarbe, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            {logoUrl && <img src={logoUrl} alt="Logo" style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'contain', background: 'rgba(255,255,255,0.15)', padding: 8 }} />}
            <h2 style={{ color: 'white', fontWeight: 900, fontSize: 28, margin: 0, textAlign: 'center' }}>{branding?.Verein_Name || 'Admin Login'}</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', margin: 0, fontSize: 14 }}>Admin Login</p>
            <PasswordInput value={password} onChange={setPassword} onEnter={handleLogin} />
            {error && <p style={{ color: '#ffcccc', margin: 0, fontSize: 14 }}>{error}</p>}
            <button onClick={handleLogin}
              style={{ width: '100%', padding: 13, borderRadius: 10, border: 'none', background: 'white', color: themaFarbe, fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }}>
              Einloggen
            </button>
            <button onClick={() => { setShowLogin(false); setPassword(''); setError(''); }}
              style={{ width: '100%', padding: 11, borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: 'white', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
              ← Zurück zur App
            </button>
          </div>
        </div>
      </IonApp>
    );
  }

  return (
    <BrandingContext.Provider value={{
      branding, loading, reload, isAuthenticated,
      teamRolle, teamMannschaft, teamId, teamLoginDone, handleTeamLogout,
    }}>
      <IonApp>
        <Tab1 onAdminClick={isAdmin ? () => setShowLogin(true) : undefined} />
      </IonApp>
    </BrandingContext.Provider>
  );
};

export default App;
