// src/components/feed/ResultBox.tsx

import React from "react";

type Props = {
  home?: string;
  away?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  teams?: string[];
  competition?: string;
};

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: 28,
  padding: "0 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  background: "rgba(255,255,255,0.18)",
  border: "1px solid rgba(255,255,255,0.25)",
  color: "rgba(255,255,255,0.96)",
  letterSpacing: "0.1px",
  whiteSpace: "nowrap",
};

const ResultBox: React.FC<Props> = ({
  home,
  away,
  homeScore,
  awayScore,
  teams,
  competition,
}) => {
  const leftTeam = home || "Scorpions";
  const rightTeam = away || "Gegner";

  const hs = typeof homeScore === "number" ? homeScore : null;
  const as = typeof awayScore === "number" ? awayScore : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Chips */}
      {(teams?.length || competition) && (
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            padding: "10px 12px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.20)",
          }}
        >
          {(teams || []).slice(0, 3).map((t) => (
            <span key={t} style={chipStyle}>
              {t}
            </span>
          ))}
          {competition ? <span style={chipStyle}>{competition}</span> : null}
        </div>
      )}

      {/* Score row */}
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          gap: 10,
          padding: 12,
          borderRadius: 16,
          background: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(0,0,0,0.05)",
          boxShadow: "0 10px 24px rgba(0,0,0,0.10)",
        }}
      >
        {/* Home team */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            color: "rgba(0,0,0,0.72)",
            padding: "6px 8px",
            minWidth: 0,
          }}
        >
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
            }}
            title={leftTeam}
          >
            {leftTeam}
          </span>
        </div>

        {/* Score pill (niemals Umbruch) */}
        <div
          style={{
            minWidth: 128, // ✅ verhindert Umbruch
            padding: "8px 12px",
            borderRadius: 14,
            background: "rgba(0,0,0,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 20,
            color: "rgba(0,0,0,0.72)",
            whiteSpace: "nowrap", // ✅ wichtig
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {hs !== null && as !== null ? `${hs} : ${as}` : "— : —"}
        </div>

        {/* Away team */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            color: "rgba(0,0,0,0.72)",
            padding: "6px 8px",
            minWidth: 0,
          }}
        >
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
            }}
            title={rightTeam}
          >
            {rightTeam}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResultBox;
