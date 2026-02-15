// src/components/feed/FeedList.tsx

import React, { useMemo } from "react";
import { IonSpinner } from "@ionic/react";
import FeedItem from "./FeedItem";
import type { FeedRow } from "../../utils/feed";

type Props = {
  items: FeedRow[];
  loading?: boolean;
  error?: string | null;
};

function sortNewestFirst(a: FeedRow, b: FeedRow): number {
  const at = a.date ? a.date.getTime() : -Infinity;
  const bt = b.date ? b.date.getTime() : -Infinity;

  // Neueste zuerst
  if (bt !== at) return bt - at;

  // Stabiler Fallback: p-Nummer (p10 > p2)
  const anum = Number(String(a.id).replace(/[^\d]/g, ""));
  const bnum = Number(String(b.id).replace(/[^\d]/g, ""));
  if (Number.isFinite(anum) && Number.isFinite(bnum) && bnum !== anum) return bnum - anum;

  // Letzter Fallback: String-Vergleich
  return String(b.id).localeCompare(String(a.id));
}

const FeedList: React.FC<Props> = ({ items, loading, error }) => {
  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort(sortNewestFirst);
    return copy;
  }, [items]);

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", padding: "28px 0" }}>
        <IonSpinner name="crescent" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 16, opacity: 0.85, lineHeight: 1.4 }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Fehler beim Laden</div>
        <div style={{ fontSize: 14 }}>{error}</div>
      </div>
    );
  }

  if (!sorted.length) {
    return <div style={{ padding: 16, opacity: 0.75 }}>Keine Einträge</div>;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: "14px 14px 26px",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      {sorted.map((it) => (
        <FeedItem key={it.id} item={it} />
      ))}
    </div>
  );
};

export default FeedList;
