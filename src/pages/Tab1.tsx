// src/pages/Tab1.tsx

import React, { useCallback, useEffect, useState } from "react";
import { IonContent, IonPage, IonRefresher, IonRefresherContent } from "@ionic/react";
import AppHeader from "../components/AppHeader";
import FeedList from "../components/feed/FeedList";
import { fetchFeed, type FeedRow } from "../utils/feed";

const Tab1: React.FC = () => {
  const [items, setItems] = useState<FeedRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const rows = await fetchFeed();
      setItems(rows);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <IonPage>
      <AppHeader title="Scorpions Feed" onRefresh={load} loading={loading} />

      <IonContent fullscreen>
        <IonRefresher
          slot="fixed"
          onIonRefresh={async (ev) => {
            await load();
            ev.detail.complete();
          }}
        >
          <IonRefresherContent />
        </IonRefresher>

        <FeedList items={items} loading={loading} error={error} />
      </IonContent>
    </IonPage>
  );
};

export default Tab1;

