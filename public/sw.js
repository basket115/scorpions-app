// ONLANG Vereins-App – minimaler Service Worker.
//
// Zweck: nur die Installation als App ermoeglichen (Samsung Internet
// verlangt einen Service Worker mit fetch-Ereignis). Er speichert NICHTS
// zwischen und beantwortet keine Anfrage selbst: ohne respondWith() laeuft
// jede Anfrage ganz normal ueber das Netz – Beitraege bleiben immer aktuell.
//
// Abschalten: diese Datei durch eine Fassung ersetzen, die sich selbst
// abmeldet (self.registration.unregister()), oder die Anmeldung in
// src/index.tsx entfernen.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // absichtlich leer: Browser holt alles wie ohne Service Worker
});
