import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { LanguageProvider } from "./i18n/LanguageContext";

const root = document.getElementById("root");

// Minimaler Service Worker (public/sw.js, speichert nichts zwischen): nur
// damit sich die App auch in Samsung Internet installieren laesst.
if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((e) => console.warn("[SW] nicht angemeldet", e));
  });
}

if (root) {
  ReactDOM.render(
    <LanguageProvider>
      <App />
    </LanguageProvider>,
    root
  );
}
