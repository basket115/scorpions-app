// src/utils/akzentfarbe.ts
// Akzentfarbe für Knöpfe und Hervorhebungen – gleiche Regel wie die Website
// (onlang-web template7.html, applyBranding: --primary-flaeche):
// Ist die Vereinsfarbe zum dunklen Website-Hintergrund unter 3:1 und gibt es
// eine Akzentfarbe (kunden.akzent_farbe), nehmen Knöpfe die Akzentfarbe.
// Schrift darauf: dunkel ab Helligkeit 0,4, sonst weiß.
// Ohne Akzentfarbe bleibt alles wie bisher (Vereinsfarbe, weiße Schrift).

// Seiten-Hintergrund der Website (template7.html --bg), nicht der App.
const WEBSITE_HINTERGRUND = '#071726';
const MUSTER = /^#[0-9a-f]{6}$/i;

export interface AkzentFarben {
  aktiv: boolean;   // true: Akzentfarbe statt Vereinsfarbe
  flaeche: string;  // Hintergrund von Knöpfen und Hervorhebungen
  schrift: string;  // Schrift und Symbole auf der Fläche
  hell: boolean;    // Fläche ist hell (Schrift dunkel)
}

// Relative Helligkeit nach WCAG (0 = Schwarz, 1 = Weiß), wie farbHelligkeit_.
export function helligkeit(hex: string): number {
  const h = String(hex).replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(h.substring(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Kontrast zweier Farben nach WCAG (1 = gleich, 21 = Schwarz/Weiß), wie farbKontrast_.
export function kontrast(a: string, b: string): number {
  const [x, y] = [helligkeit(a), helligkeit(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

export function akzentFarben(themaFarbe: string, akzentFarbe?: unknown): AkzentFarben {
  const akzent = typeof akzentFarbe === 'string' ? akzentFarbe.trim() : '';
  const aktiv = MUSTER.test(akzent) && MUSTER.test(themaFarbe) && kontrast(themaFarbe, WEBSITE_HINTERGRUND) < 3;
  if (!aktiv) return { aktiv: false, flaeche: themaFarbe, schrift: 'white', hell: false };
  const hell = helligkeit(akzent) > 0.4;
  return { aktiv: true, flaeche: akzent, schrift: hell ? '#111111' : '#FFFFFF', hell };
}
