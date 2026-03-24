// src/App.tsx
import React, { useState, useEffect } from 'react';
import React, { useState, useEffect, createContext } from 'react';
import { IonApp } from '@ionic/react';
import Tab1 from './pages/Tab1';
import AdminPage from './pages/AdminPage';
@@ -25,14 +25,33 @@ const FALLBACK_LOGO = 'https://i.imgur.com/ZKh41DS.jpeg';

type Screen = 'feed' | 'login' | 'admin';

type Branding = {
export type Branding = {
themaFarbe: string;
logoUrl: string;
sponsorLogoUrl: string;
passwort: string;
vereinName: string;
  webUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
};

// ✅ BrandingContext für alle Kind-Komponenten
export const BrandingContext = createContext<Branding>({
  themaFarbe: FALLBACK_COLOR,
  logoUrl: FALLBACK_LOGO,
  sponsorLogoUrl: '',
  passwort: '',
  vereinName: 'Scorpions SG Gierath',
  webUrl: '',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  tiktokUrl: '',
});

const App: React.FC = () => {
const [screen, setScreen] = useState<Screen>('feed');
const [password, setPassword] = useState('');
@@ -43,6 +62,11 @@ const App: React.FC = () => {
sponsorLogoUrl: '',
passwort: 'scorpions-admin',
vereinName: 'Scorpions SG Gierath',
    webUrl: '',
    facebookUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    tiktokUrl: '',
});

useEffect(() => {
@@ -61,12 +85,16 @@ const App: React.FC = () => {
sponsorLogoUrl: b.Logo_Sponsor || b.Logo_sponsor || '',
passwort: b.Passwort || 'scorpions-admin',
vereinName,
            // ✅ Social URLs aus Sheet
            webUrl: b.WEB_URL || '',
            facebookUrl: b.Facebook_URL || '',
            instagramUrl: b.Instragram_URL || b.Instagram_URL || '',
            youtubeUrl: b.Youtube_URL || '',
            tiktokUrl: b.TikTok_URL || '',
});

// ✅ Browser-Tab Titel
document.title = vereinName;

          // ✅ Apple PWA Titel
const appleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
if (appleMeta) appleMeta.setAttribute('content', vereinName);

@@ -125,15 +153,10 @@ const App: React.FC = () => {
if (screen === 'login') {
return (
<IonApp>
        <div style={{
          minHeight: '100vh', background: branding.themaFarbe,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
        <div style={{ minHeight: '100vh', background: branding.themaFarbe, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
<div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
{branding.logoUrl && (
              <img src={branding.logoUrl} alt="Logo"
                style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'contain', background: 'rgba(255,255,255,0.15)', padding: 8 }} />
              <img src={branding.logoUrl} alt="Logo" style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'contain', background: 'rgba(255,255,255,0.15)', padding: 8 }} />
)}
<h2 style={{ color: 'white', fontWeight: 900, fontSize: 28, margin: 0 }}>
{branding.vereinName} Admin
@@ -145,26 +168,13 @@ const App: React.FC = () => {
value={password}
onChange={e => setPassword(e.target.value)}
onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{
                width: '100%', padding: '13px 16px', borderRadius: 10, border: 'none',
                fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box' as const,
                color: '#111111',
              }}
              style={{ width: '100%', padding: '13px 16px', borderRadius: 10, border: 'none', fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box' as const, color: '#111111' }}
/>
{error && <p style={{ color: '#ffcccc', margin: 0, fontSize: 14 }}>{error}</p>}
            <button onClick={handleLogin} style={{
              width: '100%', padding: 13, borderRadius: 10, border: 'none',
              background: 'white', color: branding.themaFarbe, fontWeight: 700,
              fontSize: 16, cursor: 'pointer', fontFamily: 'inherit',
            }}>
            <button onClick={handleLogin} style={{ width: '100%', padding: 13, borderRadius: 10, border: 'none', background: 'white', color: branding.themaFarbe, fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }}>
Einloggen
</button>
            <button onClick={() => { setScreen('feed'); setPassword(''); setError(''); }} style={{
              width: '100%', padding: 11, borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'transparent', color: 'white', fontSize: 15,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
            <button onClick={() => { setScreen('feed'); setPassword(''); setError(''); }} style={{ width: '100%', padding: 11, borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: 'white', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
← Zurück zur App
</button>
</div>
@@ -176,21 +186,25 @@ const App: React.FC = () => {
if (screen === 'admin') {
return (
<IonApp>
        <AdminPage onBack={() => setScreen('feed')} branding={branding} />
        <BrandingContext.Provider value={branding}>
          <AdminPage onBack={() => setScreen('feed')} branding={branding} />
        </BrandingContext.Provider>
</IonApp>
);
}

return (
    <IonApp>
      <Tab1
        onAdminClick={() => setScreen('login')}
        logoUrl={branding.logoUrl}
        sponsorLogoUrl={branding.sponsorLogoUrl}
        themaFarbe={branding.themaFarbe}
        vereinName={branding.vereinName}
      />
    </IonApp>
    <BrandingContext.Provider value={branding}>
      <IonApp>
        <Tab1
          onAdminClick={() => setScreen('login')}
          logoUrl={branding.logoUrl}
          sponsorLogoUrl={branding.sponsorLogoUrl}
          themaFarbe={branding.themaFarbe}
          vereinName={branding.vereinName}
        />
      </IonApp>
    </BrandingContext.Provider>
);
};
