// src/App.tsx
import React, { useState, useEffect } from 'react';
import { IonApp, IonSpinner } from '@ionic/react';
import Tab1 from './pages/Tab1';
import AdminPage from './pages/AdminPage';

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

const API =
  'https://script.google.com/macros/s/AKfycbwm0nO0XRsJD2gqWTbfZvRHdKTN0ylbJrWkJt66TcCCiBkX8l7aaV2lF5saHEBwwqeUoA/exec';

const KUNDEN_ID = 'V002';
const FALLBACK_COLOR = '#C4161C';
const FALLBACK_LOGO = 'https://i.imgur.com/ZKh41DS.jpeg';

type Screen = 'feed' | 'login' | 'admin';

type Branding = {
  themaFarbe: string;
  logoUrl: string;
  sponsorLogoUrl: string;
  passwort: string;
  vereinName: string;
};

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('feed');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [branding, setBranding] = useState<Branding>({
    themaFarbe: FALLBACK_COLOR,
    logoUrl: FALLBACK_LOGO,
    sponsorLogoUrl: '',
    passwort: 'scorpions-admin',
    vereinName: 'Scorpions SG Gierath',
  });

  useEffect(() => {
    fetch(`${API}?action=get_branding&kundenId=${KUNDEN_ID}`, { redirect: 'follow' })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.branding) {
          const b = data.branding;
          setBranding({
            themaFarbe: b.Thema_Farbe || FALLBACK_COLOR,
            logoUrl: b.Logo_verein || b.Logo_Verein || FALLBACK_LOGO,
            sponsorLogoUrl: b.Logo_Sponsor || b.Logo_sponsor || '',
            passwort: b.Passwort || 'scorpions-admin',
            vereinName: b.Verein_Name || 'Scorpions SG Gierath',
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = () => {
    if (password === branding.passwort) {
      setError('');
      setPassword('');
      setScreen('admin');
    } else {
      setError('Falsches Passwort!');
    }
  };

  if (screen === 'login') {
    return (
      <IonApp>
        <div style={{
          minHeight: '100vh', background: branding.themaFarbe,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            {branding.logoUrl && (
              <img
                src={branding.logoUrl}
                alt="Logo"
                style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'contain', background: 'rgba(255,255,255,0.15)', padding: 8 }}
              />
            )}
            <h2 style={{ color: 'white', fontWeight: 900, fontSize: 28, margin: 0 }}>
              {branding.vereinName} Admin
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', margin: 0, fontSize: 14 }}>Bitte Passwort eingeben</p>
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{
                width: '100%', padding: '13px 16px', borderRadius: 10, border: 'none',
                fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box' as const,
              }}
            />
            {error && <p style={{ color: '#ffcccc', margin: 0, fontSize: 14 }}>{error}</p>}
            <button
              onClick={handleLogin}
              style={{
                width: '100%', padding: 13, borderRadius: 10, border: 'none',
                background: 'white', color: branding.themaFarbe, fontWeight: 700,
                fontSize: 16, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Einloggen
            </button>
            <button
              onClick={() => { setScreen('feed'); setPassword(''); setError(''); }}
              style={{
                width: '100%', padding: 11, borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'transparent', color: 'white', fontSize: 15,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              ← Zurück zur App
            </button>
          </div>
        </div>
      </IonApp>
    );
  }

  if (screen === 'admin') {
    return (
      <IonApp>
        <AdminPage onBack={() => setScreen('feed')} branding={branding} />
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
  );
};

export default App;
