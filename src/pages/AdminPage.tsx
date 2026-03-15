// src/pages/AdminPage.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonTitle,
  IonButton, IonIcon, IonSpinner, IonRefresher, IonRefresherContent,
} from '@ionic/react';
import { addOutline, trashOutline, arrowBackOutline, refreshOutline } from 'ionicons/icons';

const API =
  'https://script.google.com/macros/s/AKfycbwm0nO0XRsJD2gqWTbfZvRHdKTN0ylbJrWkJt66TcCCiBkX8l7aaV2lF5saHEBwwqeUoA/exec';

const SCORPIONS_RED = '#C4161C';
const KUNDEN_ID = 'V002';

type Beitrag = {
  id: string;
  Titel: string;
  Text: string;
  Bild_URL?: string;
  Video_URL?: string;
  Datum?: string;
  Kategorie?: string;
  Gelöscht?: string;
};

async function apiFetch(params: Record<string, string>) {
  const url = `${API}?${new URLSearchParams(params)}`;
  const r = await fetch(url, { redirect: 'follow' });
  return r.json();
}

type Props = { onBack: () => void };

const AdminPage: React.FC<Props> = ({ onBack }) => {
  const [beitraege, setBeitraege] = useState<Beitrag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  // Form state
  const [titel, setTitel] = useState('');
  const [text, setText] = useState('');
  const [bildUrl, setBildUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [kategorie, setKategorie] = useState('News');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch({ action: 'get_beitraege', kundenId: KUNDEN_ID });
      setBeitraege(data.rows || data.beitraege || []);
    } catch {
      setBeitraege([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!titel.trim() || !text.trim()) {
      alert('Titel und Text sind Pflichtfelder!');
      return;
    }
    setSaving(true);
    try {
      const params = new URLSearchParams({
        action: 'add_beitrag',
        kundenId: KUNDEN_ID,
        vereinName: 'Scorpions SG Gierath',
        titel: titel.trim(),
        text: text.trim(),
        bildUrl: bildUrl.trim(),
        videoUrl: videoUrl.trim(),
        datum: new Date().toLocaleDateString('de-DE'),
        kategorie,
      });
      const data = await fetch(`${API}?${params}`, { redirect: 'follow' }).then(r => r.json());
      if (data.success) {
        setSuccess('✅ Beitrag gespeichert!');
        setTitel(''); setText(''); setBildUrl(''); setVideoUrl(''); setKategorie('News');
        setShowForm(false);
        setTimeout(() => setSuccess(''), 3000);
        load();
      } else {
        alert('Fehler: ' + (data.error || 'Unbekannt'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (beitrag: Beitrag) => {
    if (!beitrag.id) { alert('Keine ID — kann nicht gelöscht werden.'); return; }
    if (!window.confirm(`"${beitrag.Titel}" wirklich löschen?`)) return;
    setDeletingId(beitrag.id);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_beitrag', kundenId: KUNDEN_ID, id: beitrag.id }),
      }).then(r => r.json());
      if (res.success) {
        setBeitraege(prev => prev.filter(b => b.id !== beitrag.id));
      } else {
        alert('Fehler: ' + (res.error || 'Unbekannt'));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', marginBottom: 10,
    borderRadius: 8, border: '1px solid #ddd',
    fontSize: 15, fontFamily: 'inherit', background: '#fafafa',
    boxSizing: 'border-box',
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': SCORPIONS_RED } as React.CSSProperties}>
          <IonButton slot="start" fill="clear" onClick={onBack} style={{ color: 'white' }}>
            <IonIcon icon={arrowBackOutline} />
          </IonButton>
          <IonTitle style={{ color: 'white', fontWeight: 700 }}>🦂 Scorpions Admin</IonTitle>
          <IonButton slot="end" fill="clear" onClick={load} style={{ color: 'white' }}>
            <IonIcon icon={refreshOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#f0f0f0' } as React.CSSProperties}>
        <IonRefresher slot="fixed" onIonRefresh={async ev => { await load(); ev.detail.complete(); }}>
          <IonRefresherContent />
        </IonRefresher>

        <div style={{ padding: 14, maxWidth: 680, margin: '0 auto' }}>

          {/* Neuer Beitrag Button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              style={{
                width: '100%', padding: 14, borderRadius: 10,
                backgroundColor: SCORPIONS_RED, border: 'none',
                color: 'white', fontWeight: 700, fontSize: 16,
                cursor: 'pointer', marginBottom: 16, display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              ⊕ NEUEN BEITRAG ERSTELLEN
            </button>
          )}

          {/* Formular */}
          {showForm && (
            <div style={{ background: 'white', borderRadius: 14, padding: 16, marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}>
              <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 18, fontWeight: 700 }}>📝 Neuer Beitrag</h3>

              <input placeholder="Titel *" value={titel} onChange={e => setTitel(e.target.value)} style={inputStyle} />
              <textarea
                placeholder="Text *" value={text} onChange={e => setText(e.target.value)} rows={4}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 90 }}
              />
              <input placeholder="Bild URL (optional)" value={bildUrl} onChange={e => setBildUrl(e.target.value)} style={inputStyle} />
              <input placeholder="▶ YouTube URL (optional)" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} style={inputStyle} />
              <select value={kategorie} onChange={e => setKategorie(e.target.value)} style={inputStyle}>
                {['News', 'Ergebnis', 'Training', 'Sonstiges'].map(k => <option key={k}>{k}</option>)}
              </select>

              {success && <p style={{ color: '#34a853', marginBottom: 10 }}>{success}</p>}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: 15 }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSave} disabled={saving}
                  style={{ flex: 2, padding: 12, borderRadius: 8, border: 'none', backgroundColor: SCORPIONS_RED, color: 'white', fontWeight: 700, cursor: saving ? 'default' : 'pointer', fontSize: 15, opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Speichern...' : 'Veröffentlichen'}
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, background: 'white', borderRadius: 12, padding: '12px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: SCORPIONS_RED }}>{beitraege.length}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Beiträge</div>
            </div>
            <div style={{ flex: 1, background: 'white', borderRadius: 12, padding: '12px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#34a853' }}>✓</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Alle aktiv</div>
            </div>
            <div style={{ flex: 1, background: 'white', borderRadius: 12, padding: '12px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#f0a500' }}>V002</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Kunden-ID</div>
            </div>
          </div>

          {/* Beiträge Liste */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <IonSpinner name="crescent" />
            </div>
          ) : beitraege.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: 32 }}>Noch keine Beiträge.</div>
          ) : (
            beitraege.map((b, i) => (
              <div key={b.id || i} style={{
                background: 'white', borderRadius: 12, padding: 14, marginBottom: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex',
                alignItems: 'flex-start', gap: 12, position: 'relative',
              }}>
                {/* Bild Thumbnail */}
                {b.Bild_URL && (
                  <img src={b.Bild_URL} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />
                )}
                {!b.Bild_URL && (
                  <div style={{ width: 64, height: 64, borderRadius: 8, background: `linear-gradient(135deg, ${SCORPIONS_RED}, rgba(196,22,28,0.5))`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                    🦂
                  </div>
                )}

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: '#aaa', marginBottom: 3 }}>
                    {b.Kategorie || 'News'} {b.Datum ? `• ${b.Datum}` : ''}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.Titel || 'Ohne Titel'}
                  </div>
                  <div style={{ fontSize: 13, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 40 }}>
                    {b.Text || ''}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(b)}
                  disabled={deletingId === b.id}
                  style={{
                    position: 'absolute', top: 12, right: 12,
                    background: deletingId === b.id ? '#ccc' : '#ff4444',
                    color: 'white', border: 'none', borderRadius: 8,
                    padding: '4px 10px', fontSize: 13, cursor: deletingId === b.id ? 'default' : 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {deletingId === b.id ? '...' : '🗑️'}
                </button>
              </div>
            ))
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminPage;
