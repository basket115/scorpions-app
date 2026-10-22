// Installation der Vereins-App als PWA ("App installieren" im Kopf).
//
// - Chrome/Edge/Samsung: das Ereignis beforeinstallprompt wird hier sofort
//   beim Laden abgefangen (der Kopf erscheint erst nach den Daten) und spaeter
//   per Knopf ausgeloest.
// - iPhone (alle Browser) und Firefox Android: kein solches Ereignis, dort
//   zeigt der Knopf eine kurze Anleitung.
// - In-App-Browser (Instagram, Facebook): dort geht keine Installation, der
//   Knopf zeigt den Hinweis, die Seite in Safari bzw. Chrome zu oeffnen.
// - Schon installiert (display-mode standalone, iPhone navigator.standalone)
//   oder nach appinstalled: kein Knopf.

export type InstallArt = 'fenster' | 'ios' | 'firefox' | 'inapp' | null;

type InstallEreignis = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function anleitungFuer(userAgent: string, maxTouchPoints: number): 'ios' | 'firefox' | 'inapp' | null {
  // Instagram, Facebook und Messenger (FBAN/FBAV/FB_IAB) – vor iOS pruefen
  if (/Instagram|FBAN|FBAV|FB_IAB/i.test(userAgent)) return 'inapp';
  // iPad meldet sich wie ein Mac, hat aber einen Touchscreen
  const ios = /iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1);
  if (ios) return 'ios';
  if (/Android/i.test(userAgent) && /Firefox\//i.test(userAgent)) return 'firefox';
  return null;
}

export function istInstalliert(): boolean {
  if (typeof window === 'undefined') return false;
  const modus = (m: string) => !!window.matchMedia && window.matchMedia(`(display-mode: ${m})`).matches;
  return modus('standalone') || modus('fullscreen') || (window.navigator as any).standalone === true;
}

let gemerkt: InstallEreignis | null = null;
let installiert = false;
const hoerer = new Set<() => void>();
const melde = () => hoerer.forEach((h) => h());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // nicht die Browser-Leiste, sondern unser Knopf
    gemerkt = e as InstallEreignis;
    melde();
  });
  window.addEventListener('appinstalled', () => {
    gemerkt = null;
    installiert = true;
    melde();
  });
}

export function aktuelleInstallArt(): InstallArt {
  if (installiert || istInstalliert()) return null;
  if (gemerkt) return 'fenster';
  return anleitungFuer(navigator.userAgent, navigator.maxTouchPoints || 0);
}

export function beiAenderung(h: () => void): () => void {
  hoerer.add(h);
  return () => { hoerer.delete(h); };
}

// Oeffnet das Installationsfenster des Browsers. Das Ereignis gilt nur
// einmal; lehnt der Nutzer ab, bietet der Browser es spaeter neu an.
export async function oeffneInstallFenster(): Promise<void> {
  const e = gemerkt;
  if (!e) return;
  gemerkt = null;
  melde();
  await e.prompt();
  await e.userChoice.catch(() => undefined);
}
