import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { LanguageProvider } from "./i18n/LanguageContext";

const root = document.getElementById("root");

if (root) {
  ReactDOM.render(
    <LanguageProvider>
      <App />
    </LanguageProvider>,
    root
  );
}
