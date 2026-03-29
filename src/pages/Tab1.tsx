// src/pages/Tab1.tsx
import React, { useCallback, useEffect, useState } from "react";
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

  const load = useCallback(async () => {
    setError(null); setLoading(true);
    try { const rows = await fetchFeed(); setItems(rows); }
    catch (e: any) { setError(e?.message ? String(e.message) : "Unbekannter Fehler"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <AppHeader title={vereinName || "SG Gierath"} logoUrl={logoUrl} sponsorLogoUrl={sponsorLogoUrl}
        themaFarbe={themaFarbe} onRefresh={load} loading={loading} onAdminClick={onAdminClick} />
      <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f0f0f0' }}>
        <FeedList items={items} loading={loading} error={error} />
      </div>
    </div>
  );
};

export default Tab1;
