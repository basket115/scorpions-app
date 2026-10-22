// Vereinslogos haben oft einen leeren Rand im Bild selbst (z. B. HU001:
// A4-Blatt mit Logo in der Mitte). Bei Cloudinary-Bildern schneidet e_trim
// diesen Rand beim Ausliefern ab, damit das Logo das Feld ausfuellt.
// Andere Adressen (z. B. imgur) bleiben unveraendert. Gleiche Regel wie
// logoOhneRand in Template 7.
const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(?!e_trim)/;

export function logoOhneRand(url: string): string {
  return url.replace(CLOUDINARY_UPLOAD, '$1e_trim:10/');
}
