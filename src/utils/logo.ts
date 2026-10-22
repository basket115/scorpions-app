// Vereinslogos haben oft einen leeren Rand im Bild selbst (z. B. HU001:
// A4-Blatt mit Logo in der Mitte). Bei Cloudinary-Bildern schneidet e_trim
// diesen Rand beim Ausliefern ab, damit das Logo das Feld ausfuellt.
// Andere Adressen (z. B. imgur) bleiben unveraendert. Gleiche Regel wie
// logoOhneRand in Template 7.
const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(?!e_trim)/;

export function logoOhneRand(url: string): string {
  return url.replace(CLOUDINARY_UPLOAD, '$1e_trim:10/');
}

// Quadratisches App-Symbol (PNG, Logo mittig auf Weiss, 90 %) aus einem
// Cloudinary-Logo, sonst ''. Gleiche Regel wie appSymbol() im Manifest
// (netlify/edge-functions/manifest.ts).
const CLOUDINARY = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)/;

export function appSymbol(url: string, groesse: number): string {
  if (!CLOUDINARY.test(url)) return '';
  const innen = Math.round(groesse * 0.9);
  return url.replace(CLOUDINARY, `$1e_trim:10/c_pad,w_${innen},h_${innen},b_white/c_lpad,w_${groesse},h_${groesse},b_white/f_png/`);
}
