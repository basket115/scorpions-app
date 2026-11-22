// Bilder kleiner von Cloudinary laden (22.11.2026, Bandbreite sparen).
// cloudKlein() setzt f_auto,q_auto,c_limit,w_…(,h_…) direkt hinter
// /image/upload/. c_limit verkleinert nur: nie zuschneiden, nie vergroessern,
// das Bild sieht also gleich aus. SVG-Dateien und fremde Adressen bleiben
// unveraendert. Gleiche Regel wie cloudKlein_ in Template 7.
// Neue Bildstellen bitte immer hierueber laden.
const CLOUDINARY_BILD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

export function istSvg(url: string): boolean {
  return /\.svg(?:[?#]|$)/i.test(String(url || ''));
}

export function cloudKlein(url: string, breite: number, hoehe?: number): string {
  const u = String(url || '');
  if (!u || istSvg(u)) return u;
  const m = u.match(CLOUDINARY_BILD);
  if (!m) return u;
  return m[1] + 'f_auto,q_auto,c_limit,w_' + breite + (hoehe ? ',h_' + hoehe : '') + '/' + m[2];
}

// onError-Helfer: laedt die kleine Fassung nicht, einmal das Original.
export function aufOriginal(original: string) {
  return (e: { currentTarget: HTMLImageElement }) => {
    if (original && e.currentTarget.getAttribute('src') !== original) e.currentTarget.src = original;
  };
}
