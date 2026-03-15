// src/App.tsx
import React, { useState } from 'react';
import { IonApp } from '@ionic/react';
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

const SCORPIONS_RED = '#C4161C';
const ADMIN_PASSWORD = 'scorpions-admin';

type Screen = 'feed' | 'login' | 'admin';

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('feed');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
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
          minHeight: '100vh', background: SCORPIONS_RED,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 56 }}>🦂</div>
            <h2 style={{ color: 'white', fontWeight: 900, fontSize: 28, margin: 0 }}>Scorpions Admin</h2>
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
                background: 'white', color: SCORPIONS_RED, fontWeight: 700,
                fontSize: 16, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Einloggen
            </button>
            <button
              onClick={() => { setScreen('feed'); setPassword(''); setError(''); }}
              style={{
                width: '100%', padding: 11, borderRadius: 10, border: '1px solid rgba(255,255,255,0.3)',
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
        <AdminPage onBack={() => setScreen('feed')} />
      </IonApp>
    );
  }

  return (
    <IonApp>
      <Tab1 onAdminClick={() => setScreen('login')} />
    </IonApp>
  );
};

export default App;
