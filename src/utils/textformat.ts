// Textformat der Beiträge – so, wie das ONLANG Studio den Text speichert.
// Der Text ist reiner Text mit fünf Auszeichnungen, KEIN HTML:
//   Absatz      Leerzeile (ein einfacher Zeilenumbruch bleibt erhalten)
//   fett        **Text**
//   kursiv      _Text_
//   Link        [Text](https://…), jede Adresse mit http:// oder https://
//               und www.… (wird zu https://www.…)
//   Video       eine Zeile, in der nur ein YouTube- oder MP4-Link steht
//
// Hier wird der Text nur ZERLEGT. Die Anzeige (components/BeitragsText.tsx)
// baut daraus Elemente und setzt nie HTML ein: was im Text wie HTML aussieht
// (<b>, <script> …), erscheint als Text. Gleiche Regeln wie in Template 7
// (beitragsTextZuHtml_) und im Beitragsfenster (public/embed.html).

export interface TextStueck {
  text: string;
  fett?: boolean;
  kursiv?: boolean;
  // Nur http:// oder https://. Gesetzt = das Stück ist ein Link.
  adresse?: string;
}

export type TextBlock =
  | { art: 'absatz'; zeilen: TextStueck[][] }
  | { art: 'video'; typ: 'youtube' | 'mp4'; adresse: string; youtubeId: string };

const ADRESSE_MUSTER = /^https?:\/\/[^\s<>"']+$/i;

export function youtubeId(url: string): string {
  const m = String(url || '').match(/(?:youtube(?:-nocookie)?\.com\/(?:(?:watch|attribution_link)?\?(?:.*&)?v=|(?:embed|shorts|live|v|e)\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}

// '' = kein Video. Nur eine Zeile, die ganz aus der Adresse besteht.
export function videoArt(zeile: string): '' | 'youtube' | 'mp4' {
  const u = String(zeile || '').trim();
  if (!ADRESSE_MUSTER.test(u)) return '';
  if (youtubeId(u)) return 'youtube';
  return /\.mp4(\?[^\s]*)?$/i.test(u) ? 'mp4' : '';
}

// Satzzeichen am Ende einer Adresse gehören nicht dazu.
function ohneEnde(adresse: string): [string, string] {
  const ende = (adresse.match(/[.,;:!?)\]"]+$/) || [''])[0];
  return [adresse.slice(0, adresse.length - ende.length), ende];
}

// Eine Zeile in Stücke: erst Links und Adressen, dann fett, dann kursiv.
export function zerlegeZeile(zeile: string): TextStueck[] {
  const links: { adresse: string; text: string }[] = [];
  const merke = (adresse: string, text: string): string => {
    links.push({ adresse, text });
    return '\u0000' + (links.length - 1) + '\u0000';
  };

  let s = String(zeile == null ? '' : zeile).replace(/\u0000/g, '');
  // [Text](https://…)
  s = s.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)<>]+)\)/gi, (_m, text, adresse) => merke(adresse, text));
  // nackte Adresse mit http:// oder https://
  s = s.replace(/https?:\/\/[^\s<>‹›\u0000]+/gi, (adresse) => {
    const teile = ohneEnde(adresse);
    return teile[0].length > 8 ? merke(teile[0], teile[0]) + teile[1] : adresse;
  });
  // Adresse, die mit www. beginnt: als https://www.… Nur am Zeilenanfang oder
  // nach Leerzeichen, Klammer, Anführungszeichen; nach dem www. muss ein
  // Name mit Punkt folgen (www.verein.de).
  s = s.replace(/(^|[\s(„«›"])(www\.[a-z0-9äöüß-]+(?:\.[a-z0-9äöüß-]+)+[^\s<>‹›\u0000]*)/gi, (_m, davor, adresse) => {
    const teile = ohneEnde(adresse);
    return davor + merke('https://' + teile[0], teile[0]) + teile[1];
  });

  const stuecke: TextStueck[] = [];
  // Text ohne Auszeichnung → Text-Stücke und Links (mit fett/kursiv von außen).
  const lege = (text: string, fett: boolean, kursiv: boolean) => {
    text.split(/(\u0000\d+\u0000)/).forEach((teil) => {
      if (!teil) return;
      const m = teil.match(/^\u0000(\d+)\u0000$/);
      const link = m ? links[Number(m[1])] : null;
      const stueck: TextStueck = { text: link ? link.text : teil };
      if (fett) stueck.fett = true;
      if (kursiv) stueck.kursiv = true;
      if (link) stueck.adresse = link.adresse;
      stuecke.push(stueck);
    });
  };
  // _kursiv_: nur am Anfang oder nach Leerzeichen/Klammer, und vor Ende,
  // Leerzeichen oder Satzzeichen – so bleibt ein_name_mit_strichen Text.
  const mitKursiv = (text: string, fett: boolean) => {
    const muster = /(^|[\s(„"«])_([^_\n]+?)_(?=$|[\s.,;:!?)“"»])/g;
    let pos = 0;
    let m = muster.exec(text);
    while (m) {
      lege(text.slice(pos, m.index) + m[1], fett, false);
      lege(m[2], fett, true);
      pos = m.index + m[0].length;
      m = muster.exec(text);
    }
    lege(text.slice(pos), fett, false);
  };
  // **fett**
  const fettMuster = /\*\*([^*\n]+?)\*\*/g;
  let pos = 0;
  let m = fettMuster.exec(s);
  while (m) {
    mitKursiv(s.slice(pos, m.index), false);
    mitKursiv(m[1], true);
    pos = m.index + m[0].length;
    m = fettMuster.exec(s);
  }
  mitKursiv(s.slice(pos), false);
  return stuecke;
}

// Der ganze Text in Blöcke: Absätze (mit ihren Zeilen) und Videos.
export function zerlegeText(text: string): TextBlock[] {
  const zeilen = String(text == null ? '' : text).replace(/\r\n?/g, '\n').split('\n');
  const bloecke: TextBlock[] = [];
  let absatz: TextStueck[][] = [];
  const schliesse = () => {
    if (absatz.length) { bloecke.push({ art: 'absatz', zeilen: absatz }); absatz = []; }
  };
  zeilen.forEach((zeile) => {
    const kurz = zeile.trim();
    if (!kurz) { schliesse(); return; }
    const typ = videoArt(kurz);
    if (typ) { schliesse(); bloecke.push({ art: 'video', typ, adresse: kurz, youtubeId: youtubeId(kurz) }); return; }
    absatz.push(zerlegeZeile(zeile));
  });
  schliesse();
  return bloecke;
}

// Für Kurztexte: der Text ohne die Auszeichnungen und ohne Video-Zeilen.
export function ohneTextformat(text: string): string {
  return String(text == null ? '' : text).replace(/\r\n?/g, '\n').split('\n')
    .filter((zeile) => !videoArt(zeile.trim())).join('\n')
    .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)<>]+)\)/gi, '$1')
    .replace(/\*\*([^*\n]+?)\*\*/g, '$1')
    .replace(/(^|[\s(„"«])_([^_\n]+?)_(?=$|[\s.,;:!?)“"»])/gm, '$1$2');
}
