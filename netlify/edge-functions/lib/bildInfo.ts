// Ermittelt Format (MIME-Typ) und Pixelmasse eines Bildes aus seinen
// ersten Bytes - fuer korrekte "type"/"sizes"-Angaben im PWA-Manifest,
// wenn ein Kunde kein eigenes App-Icon hat und das Vereinslogo dient.
// Liest hoechstens MAX_BYTES und bricht den Download danach ab.

export type BildInfo = { type: string; width: number; height: number };

const MAX_BYTES = 65536;

async function ersteBytes(url: string): Promise<Uint8Array | null> {
  const response = await fetch(url, {
    method: "GET",
    headers: { Range: `bytes=0-${MAX_BYTES - 1}`, "User-Agent": "Netlify-Edge-PWA-Manifest/1.0" },
    redirect: "follow",
    signal: AbortSignal.timeout(3000),
  });
  if (!response.ok || !response.body) return null;

  // Server ohne Range-Unterstuetzung schicken die ganze Datei - dann nach
  // MAX_BYTES abbrechen statt z. B. ein 1-MB-Logo komplett zu laden.
  const reader = response.body.getReader();
  const teile: Uint8Array[] = [];
  let laenge = 0;
  while (laenge < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    teile.push(value);
    laenge += value.length;
  }
  await reader.cancel().catch(() => {});

  const bytes = new Uint8Array(Math.min(laenge, MAX_BYTES));
  let pos = 0;
  for (const teil of teile) {
    const rest = bytes.length - pos;
    if (rest <= 0) break;
    bytes.set(teil.subarray(0, rest), pos);
    pos += Math.min(teil.length, rest);
  }
  return bytes;
}

function png(b: Uint8Array, v: DataView): BildInfo | null {
  const signatur = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (b.length < 24 || !signatur.every((x, i) => b[i] === x)) return null;
  return { type: "image/png", width: v.getUint32(16), height: v.getUint32(20) };
}

function jpeg(b: Uint8Array, v: DataView): BildInfo | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    if (b[i + 1] === 0xff) { i++; continue; } // Fuellbyte
    const marker = b[i + 1];
    // SOF0-SOF15 ausser DHT (C4), JPG (C8), DAC (CC) enthalten die Masse.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { type: "image/jpeg", width: v.getUint16(i + 7), height: v.getUint16(i + 5) };
    }
    i += 2 + v.getUint16(i + 2);
  }
  return null;
}

function webp(b: Uint8Array, v: DataView): BildInfo | null {
  const text = (start: number, ende: number) => String.fromCharCode(...b.subarray(start, ende));
  if (b.length < 30 || text(0, 4) !== "RIFF" || text(8, 12) !== "WEBP") return null;
  const art = text(12, 16);
  if (art === "VP8 ") {
    return { type: "image/webp", width: v.getUint16(26, true) & 0x3fff, height: v.getUint16(28, true) & 0x3fff };
  }
  if (art === "VP8L") {
    const bits = v.getUint32(21, true);
    return { type: "image/webp", width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (art === "VP8X") {
    const breite = 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
    const hoehe = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
    return { type: "image/webp", width: breite, height: hoehe };
  }
  return null;
}

// null bei jedem Fehler (nicht erreichbar, Timeout, unbekanntes Format).
export async function ladeBildInfo(url: string): Promise<BildInfo | null> {
  try {
    const bytes = await ersteBytes(url);
    if (!bytes) return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const info = png(bytes, view) || jpeg(bytes, view) || webp(bytes, view);
    if (!info || info.width <= 0 || info.height <= 0) return null;
    return info;
  } catch (error) {
    console.error("[Bild-Info] Bild konnte nicht gelesen werden", url, error);
    return null;
  }
}
