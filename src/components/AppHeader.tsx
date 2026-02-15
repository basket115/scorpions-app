// src/components/AppHeader.tsx

import React, { useEffect } from "react";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonSpinner,
} from "@ionic/react";
import { refreshOutline } from "ionicons/icons";

type Props = {
  title: string;
  onRefresh?: () => void | Promise<void>;
  loading?: boolean;
};

// ✅ Scorpions Logo
const SCORPIONS_LOGO_URL =
  "https://drive.google.com/thumbnail?id=1SevxeW5MTP5Trzs5ayYJfl_SsdPe3LXa&sz=w256";

const SCORPIONS_RED = "#C4161C";
const WHITE = "#FFFFFF";

function ensureMontserrat() {
  if (!document.getElementById("montserrat-font")) {
    const link = document.createElement("link");
    link.id = "montserrat-font";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap";
    document.head.appendChild(link);
  }

  if (!document.getElementById("global-font-style")) {
    const style = document.createElement("style");
    style.id = "global-font-style";
    style.innerHTML = `
      * {
        font-family: 'Montserrat', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      }
    `;
    document.head.appendChild(style);
  }
}

const AppHeader: React.FC<Props> = ({ title, onRefresh, loading }) => {
  useEffect(() => {
    ensureMontserrat();
  }, []);

  return (
    <IonHeader>
      <IonToolbar
        style={{
          "--background": SCORPIONS_RED,
          "--color": WHITE,
          borderBottom: "1px solid rgba(255,255,255,0.25)",
        }}
      >
        <IonTitle>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14, // ✅ mehr Abstand Logo → Text
              minHeight: 44,
            }}
          >
            <img
              src={SCORPIONS_LOGO_URL}
              alt="Scorpions"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                objectFit: "cover",
                boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
                background: "rgba(255,255,255,0.15)",
                flex: "0 0 auto",
              }}
              loading="lazy"
              referrerPolicy="no-referrer"
            />

            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{title}</div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>
                News · Ergebnisse · Training
              </div>
            </div>
          </div>
        </IonTitle>

        <IonButtons slot="end">
          <IonButton onClick={() => onRefresh?.()} disabled={loading}>
            {loading ? (
              <IonSpinner name="crescent" />
            ) : (
              <IonIcon icon={refreshOutline} />
            )}
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};

export default AppHeader;
