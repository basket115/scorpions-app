// src/pages/AdminPage.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { IonSpinner } from '@ionic/react';

const API = 'https://script.google.com/macros/s/AKfycbwm0nO0XRsJD2gqWTbfZvRHdKTN0ylbJrWkJt66TcCCiBkX8l7aaV2lF5saHEBwwqeUoA/exec';
const KUNDEN_ID = 'V046';

type Beitrag = { id: string; Titel: string; Text: string; Bild_URL?: string; Datum?: string; Kategorie?: string; };
type Branding = { themaFarbe: string; logoUrl: string; sponsorLogoUrl: string; passwort: string; vereinName: string; };
type Props = { onBack: () => void; branding: Branding; };
type SponsorData = { logoUrl: string; bannerText: string; linkUrl: string; };

const AdminPage: React.FC<Props> = ({ onBack, branding }) => {
  const [beitraege, setBeitraege] = useState<Beitrag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSponsorForm, setShowSponsorForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingSponsor, setSavingSponsor] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [success, setSuccess] = useState('');
  const [titel, setTitel] = useState('');
  const [text, setText] = useState('');
  const [bildUrl, setBildUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [kategorie, setKategorie] = useState('News');
  const [sponsor, setSponsor] = useState<SponsorData>({ logoUrl: '', bannerText: '', linkUrl: '' });
  const [sponsorLogoPreview, setSponsorLogoPreview] = useState('');

  const farbe = branding.themaFarbe || '#C4161C';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetch(`${API}?action=get_beitraege&kundenId=${KUNDEN_ID}`, { redirect: 'follow' }).then(r => r.json());
      setBeitraege(data.rows || []);
    } catch { setBeitraege([]); } finally { setLoading(false); }
  }, []);

  const loadSponsor = useCallback(async () => {
    try {
      const d = await fetch(`${API}?action=get_sponsors&kundenId=${KUNDEN_ID}`, { redirect: 'follow' }).then(r => r.json());
      const rows = d?.sponsors || [];
      const found = rows.findLast((r: any) => String(r?.Aktiv).toUpperCase() === 'TRUE');
      if (found) {
        setSponsor({ logoUrl: found.Logo_URL || '', bannerText: found.Banner_Text || '', linkUrl: found.Banner_Link_URL || '' });
        setSponsorLogoPreview(found.Logo_URL || '');
      }
    } catch {}
  }, []);

  useEffect(() => { load(); loadSponsor(); }, [load, loadSponsor]);

  const handleSave = async () => {
    if (!titel.trim() || !text.trim()) { alert('Titel und Text sind Pflicht!'); return; }
    setSaving(true);
    try {
      const params = new URLSearchParams({ action: 'add_beitrag', kundenId: KUNDEN_ID, vereinName: branding.vereinName, titel: titel.trim(), text: text.trim(), bildUrl: bildUrl.trim(), videoUrl: videoUrl.trim(), datum: new Date().toLocaleDateString('de-DE'), kategorie });
      const data = await fetch(`${API}?${params}`, { redirect: 'follow' }).then(r => r.json());
      if (data.success) { setSuccess('✅ Gespeichert!'); setTitel(''); setText(''); setBildUrl(''); setVideoUrl(''); setShowForm(false); setTimeout(() => setSuccess(''), 3000); load(); }
    } finally { setSaving(false); }
  };

  const handleSaveSponsor = async () => {
    setSavingSponsor(true);
    try {
      const params = new URLSearchParams({ action: 'update_sponsor', kundenId: KUNDEN_ID, logoUrl: sponsor.logoUrl, bannerText: sponsor.bannerText, linkUrl: sponsor.linkUrl });
      const data = await fetch(`${API}?${params}`, { redirect: 'follow' }).then(r => r.json());
      if (data.success) { setSuccess('✅ Sponsor gespeichert!'); setShowSponsorForm(false); setTimeout(() => setSuccess(''), 3000); }
      else { alert('Fehler: ' + (data.error || 'Unbekannt')); }
    } finally { setSavingSponsor(false); }
  };

  const handleDelete = async (b: Beitrag) => {
    if (!window.confirm(`"${b.Titel}" löschen?`)) return;
    setDeletingId(b.id);
    try {
      const res = await fetch(`${API}?action=delete_beitrag&kundenId=${KUNDEN_ID}&id=${encodeURIComponent(b.id)}`, { redirect: 'follow' }).then(r => r.json());
      if (res.success) setBeitraege(prev => prev.filter(x => x.id !== b.id));
    } finally { setDeletingId(null); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', marginBottom: 10, borderRadius: 8, border: '1px solid #ddd', fontSize: 15, fontFamily: 'inherit', background: 'white', boxSizing: 'border-box', color: '#111' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div style={{ background: farbe, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'white', fontSize: 22, cursor: 'pointer', padding: 4 }}>←</button>
        {branding.logoUrl && <img src={branding.logoUrl} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain' }} />}
        <span style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>{branding.vereinName} Admin</span>
        <button onClick={load} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer' }}>↻</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f0f0f0', padding: 14 }}>
        {success && <div style={{ background: '#34a853', color: 'white', padding: '10px 16px', borderRadius: 10, marginBottom: 12, fontWeight: 700 }}>{success}</div>}
        {!showForm && !showSponsorForm && (
          <>
            <button onClick={() => setShowForm(true)} style={{ width: '100%', padding: 14, borderRadius: 10, backgroundColor: farbe, border: 'none', color: 'white', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginBottom: 10 }}>⊕ NEUEN BEITRAG ERSTELLEN</button>
            <button onClick={() => setShowSponsorForm(true)} style={{ width: '100%', padding: 14, borderRadius: 10, backgroundColor: 'white', border: `2px solid ${farbe}`, color: farbe, fontWeight: 700, fontSize: 16, cursor: 'pointer', marginBottom: 16 }}>🤝 SPONSOR EINRICHTEN</button>
          </>
        )}
        {showSponsorForm && (
          <div style={{ background: 'white', borderRadius: 14, padding: 16, marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}>
            <h3 style={{ marginTop: 0 }}>🤝 Sponsor einrichten</h3>
            <label style={{ fontSize: 13, color: '#666', marginBottom: 4, display: 'block' }}>Logo URL</label>
            <input placeholder="https://i.imgur.com/..." value={sponsor.logoUrl} onChange={e => { setSponsor(s => ({ ...s, logoUrl: e.target.value })); setSponsorLogoPreview(e.target.value); }} style={inputStyle} />
            {sponsorLogoPreview && <img src={sponsorLogoPreview} alt="Logo Vorschau" style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 8, marginBottom: 10, border: '1px solid #eee' }} onError={() => setSponsorLogoPreview('')} />}
            <label style={{ fontSize: 13, color: '#666', marginBottom: 4, display: 'block' }}>Banner Text</label>
            <textarea placeholder="Beschreibung des Sponsors..." value={sponsor.bannerText} onChange={e => setSponsor(s => ({ ...s, bannerText: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
            <label style={{ fontSize: 13, color: '#666', marginBottom: 4, display: 'block' }}>Link URL</label>
            <input placeholder="https://www.sponsor.de" value={sponsor.linkUrl} onChange={e => setSponsor(s => ({ ...s, linkUrl: e.target.value }))} style={inputStyle} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowSponsorForm(false)} style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #ddd', background: 'white', cursor: 'pointer', color: '#111' }}>Abbrechen</button>
              <button onClick={handleSaveSponsor} disabled={savingSponsor} style={{ flex: 2, padding: 12, borderRadius: 8, border: 'none', backgroundColor: farbe, color: 'white', fontWeight: 700, cursor: 'pointer' }}>{savingSponsor ? 'Speichern...' : '💾 Sponsor speichern'}</button>
            </div>
          </div>
        )}
        {showForm && (
          <div style={{ background: 'white', borderRadius: 14, padding: 16, marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}>
            <h3 style={{ marginTop: 0 }}>📝 Neuer Beitrag</h3>
            <input placeholder="Titel *" value={titel} onChange={e => setTitel(e.target.value)} style={inputStyle} />
            <textarea placeholder="Text *" value={text} onChange={e => setText(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' as const }} />
            <input placeholder="Bild URL (optional)" value={bildUrl} onChange={e => setBildUrl(e.target.value)} style={inputStyle} />
            <input placeholder="▶ YouTube URL (optional)" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} style={inputStyle} />
            <select value={kategorie} onChange={e => setKategorie(e.target.value)} style={inputStyle}>
              {['News', 'Ergebnis', 'Training', 'Sonstiges'].map(k => <option key={k}>{k}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid #ddd', background: 'white', cursor: 'pointer', color: '#111' }}>Abbrechen</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: 12, borderRadius: 8, border: 'none', backgroundColor: farbe, color: 'white', fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Speichern...' : 'Veröffentlichen'}</button>
            </div>
          </div>
        )}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 32 }}><IonSpinner name="crescent" /></div>
        ) : beitraege.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: 32 }}>Noch keine Beiträge.</div>
        ) : (
          beitraege.map((b, i) => (
            <div key={b.id || i} style={{ background: 'white', borderRadius: 12, padding: 14, marginBottom: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', position: 'relative' }}>
              <div style={{ fontSize: 12, color: '#aaa', marginBottom: 3 }}>{b.Kategorie || 'News'}{b.Datum ? ` • ${b.Datum}` : ''}</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a', marginBottom: 4, paddingRight: 50 }}>{b.Titel}</div>
              <div style={{ fontSize: 13, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 50 }}>{b.Text}</div>
              <button onClick={() => handleDelete(b)} disabled={deletingId === b.id} style={{ position: 'absolute', top: 12, right: 12, background: deletingId === b.id ? '#ccc' : '#ff4444', color: 'white', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>
                {deletingId === b.id ? '...' : '🗑️'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPage;
