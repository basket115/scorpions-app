// src/pages/Tab1.tsx
import React, { useCallback, useEffect, useState, useMemo } from "react";
import AppHeader from "../components/AppHeader";
import FeedList from "../components/feed/FeedList";
import { fetchFeed, type FeedRow } from "../utils/feed";

type Props = {
  onAdminClick?: () => void;
  logoUrl?: string;
  sponsorLogoUrl?: string;
  themaFarbe?: string;
  vereinName?: string;
};

const Tab1: React.FC<Props> = ({ onAdminClick, logoUrl, sponsorLogoUrl, themaFarbe, vereinName }) => {
  const [items, setItems] = useState<FeedRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeKategorie, setActiveKategorie] = useState<string>('');

  const farbe = themaFarbe || '#B71C1C';

  const load = useCallback(async () => {
    setError(null); setLoading(true);
    try { const rows = await fetchFeed(); setItems(rows); }
    catch (e: any) { setError(e?.message ? String(e.message) : "Unbekannter Fehler"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Kategorien aus Beiträgen extrahieren
  const kategorien = useMemo(() => {
    const set = new Set<string>();
    items.forEach(item => {
      const k = String(item.kategorie || '').trim();
      if (k) set.add(k);
    });
    return Array.from(set).sort();
  }, [items]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <AppHeader
        title={vereinName || "Scorpions SG Gierath"}
        logoUrl={logoUrl}
        sponsorLogoUrl={sponsorLogoUrl}
        themaFarbe={themaFarbe}
        onRefresh={load}
        loading={loading}
        onAdminClick={onAdminClick}
      />

      {/* Kategorie Icon-Bar */}
      {kategorien.length > 0 && (
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          gap: 8,
          padding: '10px 14px',
          backgroundColor: 'white',
          borderBottom: '1px solid #eee',
          scrollbarWidth: 'none',
        }}>
          {/* "Alle" Button */}
          <button
            onClick={() => setActiveKategorie('')}
            style={{
              flexShrink: 0,
              padding: '6px 14px',
              borderRadius: 20,
              border: `2px solid ${farbe}`,
              background: activeKategorie === '' ? farbe : 'white',
              color: activeKategorie === '' ? 'white' : farbe,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Alle
          </button>

          {/* Kategorie Buttons */}
          {kategorien.map(kat => (
            <button
              key={kat}
              onClick={() => setActiveKategorie(kat === activeKategorie ? '' : kat)}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: 20,
                border: `2px solid ${farbe}`,
                background: activeKategorie === kat ? farbe : 'white',
                color: activeKategorie === kat ? 'white' : farbe,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {kat}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f0f0f0' }}>
        <FeedList
          items={items}
          loading={loading}
          error={error}
          activeKategorie={activeKategorie}
        />
      </div>
    </div>
  );
};

export default Tab1;
