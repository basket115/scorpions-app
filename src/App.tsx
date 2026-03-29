// src/App.tsx
import React, { useState, useEffect, createContext } from 'react';
import { IonApp } from '@ionic/react';
import Tab1 from './pages/Tab1';
import AdminPage from './pages/AdminPage';

const API = 'https://script.google.com/macros/s/AKfycbwm0nO0XRsJD2gqWTbfZvRHdKTN0ylbJrWkJt66TcCCiBkX8l7aaV2lF5saHEBwwqeUoA/exec';
const KUNDEN_ID = 'V046';
const FALLBACK_COLOR = '#C4161C';
const FALLBACK_LOGO = '/logo.png';

type Screen = 'feed' | 'login' | 'admin';

export type Branding = {
  themaFarbe: string; logoUrl: string; sponsorLogoUrl: string; passwort: string;
  vereinName: string; webUrl: string; facebookUrl: string; instagramUrl: string;
  youtubeUrl: string; tiktokUrl: string;
};

export const BrandingContext = createContext<Branding>({
  themaFarbe: FALLBACK_COLOR, logoUrl: FALLBACK_LOGO, sponsorLogoUrl: '', passwort: '',
  vereinName: 'SG Gierath', webUrl: '', facebookUrl: '', instagramUrl: '', youtubeUrl: '', tiktokUrl: '',
});

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('feed');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [branding, setBranding] = useState<Branding>({
    themaFarbe: FALLBACK_COLOR, logoUrl: FALLBACK_LOGO, sponsorLogoUrl: '',
    passwort: 'sggierath-admin', vereinName: 'SG Gierath',
    webUrl: '', facebookUrl: '', instagramUrl: '', youtubeUrl: '', tiktokUrl: '',
  });

  useEffect(() => {
    fetch(`${API}?action=get_branding&kundenId=${KUNDEN_ID}`, { redirect: 'follow' })
      .then(r => r.json())
      .then(d => {
        if (!d?.success || !d?.branding) return;
        const b = d.branding;
        const vereinName = b.Verein_Name || b.verein_name || 'SG Gierath';
        setBranding({
          themaFarbe: b.Thema_Farbe || FALLBACK_COLOR,
          logoUrl: b.Logo_Verein || b.Logo_verein || FALLBACK_LOGO,
          sponsorLogoUrl: b.Logo_Sponsor || b.Logo_sponsor || '',
          passwort: b.Passwort || 'sggierath-admin',
          vereinName,
          webUrl: b.WEB_URL || '', facebookUrl: b.Facebook_URL || '',
          instagramUrl: b.Instragram_URL || b.Instagram_URL || '',
          youtubeUrl: b.Youtube_URL || '', tiktokUrl: b.TikTok_URL || '',
        });
        document.title = vereinName;
        const appleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
        if (appleMeta) appleMeta.setAttribute('content', vereinName);
      }).catch(() => {});
  }, []);

  const handleLogin = () => {
    if (password === branding.passwort) { setScreen('admin'); setError(''); }
    else { setError('Falsches Passwort'); }
  };

  return (
    <BrandingContext.Provider value={branding}>
      <IonApp>
        {screen === 'feed' && (
          <Tab1 onAdminClick={() => setScreen('login')} logoUrl={branding.logoUrl}
            sponsorLogoUrl={branding.sponsorLogoUrl} themaFarbe={branding.themaFarbe}
            vereinName={branding.vereinName} />
        )}
        {screen === 'admin' && <AdminPage onBack={() => setScreen('feed')} branding={branding} />}
        {screen === 'login' && (
          <div style={{ minHeight: '100vh', background: branding.themaFarbe, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              {branding.logoUrl && <img src={branding.logoUrl} alt="Logo" style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'contain', background: 'rgba(255,255,255,0.15)', padding: 8 }} />}
              <h2 style={{ color: 'white', fontWeight: 900, fontSize: 28, margin: 0 }}>{branding.vereinName} Admin</h2>
              <input type="password" placeholder="Passwort" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ width: '100%', padding: '13px 16px', borderRadius: 10, border: 'none', fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box' as const, color: '#111111' }} />
              {error && <p style={{ color: '#ffcccc', margin: 0, fontSize: 14 }}>{error}</p>}
              <button onClick={handleLogin} style={{ width: '100%', padding: 13, borderRadius: 10, border: 'none', background: 'white', color: branding.themaFarbe, fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }}>Einloggen</button>
              <button onClick={() => { setScreen('feed'); setPassword(''); setError(''); }} style={{ width: '100%', padding: 11, borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: 'white', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>← Zurück zur App</button>
            </div>
          </div>
        )}
      </IonApp>
    </BrandingContext.Provider>
  );
};

export default App;
