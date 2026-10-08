// Schriftfarbe passend zur Vereinsfarbe (Thema_Farbe).
// Gleiche Rechnung und gleicher Grenzwert wie in public/embed.html.

// Ab dieser Helligkeit gilt die Vereinsfarbe als hell (z.B. Gelb) und
// bekommt dunkle Schrift. Bewusst ein fester Grenzwert und nicht "bester
// Kontrast": Rot und Orange behalten so ihre weisse Schrift.
const HELL_AB = 0.4;
const DUNKEL = '#111111';
const DUNKEL_RGB = '17,17,17';

// Relative Helligkeit 0 (schwarz) bis 1 (weiss); null bei ungueltiger Farbe.
export function helligkeit(farbe: string | undefined | null): number | null {
  let h = String(farbe || '').trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.split('').map(z => z + z).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  const k = [0, 2, 4].map(i => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
}

// Ungueltige oder fehlende Farbe gilt als dunkel - dann bleibt alles wie bisher.
export function istHelleFarbe(farbe: string | undefined | null): boolean {
  const wert = helligkeit(farbe);
  return wert !== null && wert > HELL_AB;
}

// Schrift AUF der Vereinsfarbe (Kopfzeile, Knoepfe, Fusszeile).
// deckkraft < 1 fuer abgeschwaechte Texte und Rahmen.
export function aufFarbe(farbe: string | undefined | null, deckkraft = 1): string {
  if (istHelleFarbe(farbe)) {
    return deckkraft >= 1 ? DUNKEL : `rgba(${DUNKEL_RGB},${deckkraft})`;
  }
  return deckkraft >= 1 ? 'white' : `rgba(255,255,255,${deckkraft})`;
}

// Vereinsfarbe ALS Schrift auf hellem Grund (Abteilungsauswahl, Ueberschriften).
export function alsSchrift(farbe: string): string {
  return istHelleFarbe(farbe) ? DUNKEL : farbe;
}
