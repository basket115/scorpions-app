// Laesst aus dem Branding-Objekt nur die Felder durch, die das Frontend
// tatsaechlich liest. Alles andere (insbesondere "Passwort" und jedes
// unbekannte, womoeglich geheime Feld aus GAS) geht NIE an den Browser.
const ERLAUBTE_FELDER: readonly string[] = [
  "Kunden_ID",
  "Parent_ID",
  "Verein_Name",
  "Thema_Farbe",
  "Logo_Verein",
  "Logo_verein",
  "Logo_Sponsor",
  "Logo_sponsor",
  "Sprache",
  "Status",
  "Demo_Ende",
  "ReadOnly",
  "Kategorien",
  "WEB_URL",
  "Facebook_URL",
  "Instagram_URL",
  "Instragram_URL",
  "Youtube_URL",
  "TikTok_URL",
  "WhatsApp_URL",
  "Whatsapp_URL",
  "webUrl",
  "facebookUrl",
  "instagramUrl",
  "youtubeUrl",
  "tiktokUrl",
  "whatsappUrl",
];

export function filterBranding(branding: unknown): Record<string, unknown> | null {
  if (!branding || typeof branding !== "object" || Array.isArray(branding)) return null;

  const quelle = branding as Record<string, unknown>;
  const gefiltert: Record<string, unknown> = {};
  for (const feld of ERLAUBTE_FELDER) {
    if (Object.prototype.hasOwnProperty.call(quelle, feld)) {
      gefiltert[feld] = quelle[feld];
    }
  }
  return gefiltert;
}
