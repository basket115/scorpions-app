import { zerlegeZeile, zerlegeText, ohneTextformat, videoArt } from './textformat';

test('fett, kursiv und Link', () => {
  expect(zerlegeZeile('Normal **fett** und _kursiv_ und [ONLANG](https://www.onlang.de) Ende.')).toEqual([
    { text: 'Normal ' },
    { text: 'fett', fett: true },
    { text: ' und ' },
    { text: 'kursiv', kursiv: true },
    { text: ' und ' },
    { text: 'ONLANG', adresse: 'https://www.onlang.de' },
    { text: ' Ende.' },
  ]);
});

test('Adressen mit http, https und www. werden Links, Satzzeichen bleiben draussen', () => {
  expect(zerlegeZeile('Siehe https://verein.de/seite, oder www.onlang.de.')).toEqual([
    { text: 'Siehe ' },
    { text: 'https://verein.de/seite', adresse: 'https://verein.de/seite' },
    { text: ', oder ' },
    { text: 'www.onlang.de', adresse: 'https://www.onlang.de' },
    { text: '.' },
  ]);
});

test('was wie HTML aussieht, bleibt Text', () => {
  const stuecke = zerlegeZeile('<b>test</b> <script>alert(1)</script> <img src=x onerror=alert(1)>');
  expect(stuecke).toEqual([{ text: '<b>test</b> <script>alert(1)</script> <img src=x onerror=alert(1)>' }]);
});

test('Links nur mit http oder https', () => {
  const stuecke = zerlegeZeile('[klick](javascript:alert(1)) [x](data:text/html,1) javascript:alert(1) ftp://x.de');
  expect(stuecke.some((s) => s.adresse)).toBe(false);
  zerlegeZeile('[a](https://x.de/"onmouseover="alert(1)) www.x.de/"onclick="a').forEach((s) => {
    if (s.adresse) expect(/^https?:\/\//.test(s.adresse)).toBe(true);
  });
});

test('fett um kursiv und um einen Link', () => {
  expect(zerlegeZeile('**_beides_** und **[Link](https://x.de)**')).toEqual([
    { text: 'beides', fett: true, kursiv: true },
    { text: ' und ' },
    { text: 'Link', fett: true, adresse: 'https://x.de' },
  ]);
});

test('Unterstriche in Namen und einzelne Sternchen bleiben Text', () => {
  expect(zerlegeZeile('datei_name_final.pdf und 3 * 4 * 5')).toEqual([{ text: 'datei_name_final.pdf und 3 * 4 * 5' }]);
});

test('Absätze, Zeilenumbrüche und Video-Zeilen', () => {
  const bloecke = zerlegeText('Erste Zeile\nzweite Zeile\n\nhttps://www.youtube.com/watch?v=efBVkhWHHt0\nhttps://example.org/film.mp4\n\n\nEnde');
  expect(bloecke.map((b) => b.art)).toEqual(['absatz', 'video', 'video', 'absatz']);
  expect(bloecke[0]).toEqual({ art: 'absatz', zeilen: [[{ text: 'Erste Zeile' }], [{ text: 'zweite Zeile' }]] });
  expect(bloecke[1]).toEqual({ art: 'video', typ: 'youtube', adresse: 'https://www.youtube.com/watch?v=efBVkhWHHt0', youtubeId: 'efBVkhWHHt0' });
  expect(bloecke[2]).toEqual({ art: 'video', typ: 'mp4', adresse: 'https://example.org/film.mp4', youtubeId: '' });
});

test('Video nur, wenn die Adresse allein in der Zeile steht', () => {
  expect(videoArt('https://youtu.be/efBVkhWHHt0')).toBe('youtube');
  expect(videoArt('Schau: https://youtu.be/efBVkhWHHt0')).toBe('');
  expect(videoArt('https://youtu.be/efBVkhWHHt0"><script>')).toBe('');
  expect(videoArt('javascript:alert(1)//.mp4')).toBe('');
  expect(zerlegeText('Schau: https://youtu.be/efBVkhWHHt0')[0].art).toBe('absatz');
});

test('leerer Text und alter Text ohne Auszeichnung', () => {
  expect(zerlegeText('')).toEqual([]);
  expect(zerlegeText(undefined as any)).toEqual([]);
  expect(zerlegeText('Ganz normaler Text.')).toEqual([{ art: 'absatz', zeilen: [[{ text: 'Ganz normaler Text.' }]] }]);
});

test('Kurztext ohne Auszeichnungen und ohne Video-Zeile', () => {
  expect(ohneTextformat('**Probe** _am_ [Tag](https://x.de) www.onlang.de\nhttps://youtu.be/efBVkhWHHt0\nEnde')).toBe('Probe am Tag www.onlang.de\nEnde');
});
