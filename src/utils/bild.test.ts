import { cloudKlein, istSvg } from './bild';
import { logoOhneRand } from './logo';

const C = 'https://res.cloudinary.com/dhn90jugp/image/upload/';

test('Cloudinary-Bild wird verkleinert', () => {
  expect(cloudKlein(C + 'v1/a.jpg', 1000)).toBe(C + 'f_auto,q_auto,c_limit,w_1000/v1/a.jpg');
  expect(cloudKlein(C + 'v1/a.png', 200, 200)).toBe(C + 'f_auto,q_auto,c_limit,w_200,h_200/v1/a.png');
});

test('Logo: e_trim kommt vor das Verkleinern', () => {
  expect(logoOhneRand(cloudKlein(C + 'v1/l.png', 200, 200))).toBe(C + 'e_trim:10/f_auto,q_auto,c_limit,w_200,h_200/v1/l.png');
});

test('SVG, fremde Adressen, Videos und leer bleiben unveraendert', () => {
  expect(cloudKlein(C + 'v1/l.svg', 200)).toBe(C + 'v1/l.svg');
  expect(cloudKlein(C + 'v1/l.SVG?x=1', 200)).toBe(C + 'v1/l.SVG?x=1');
  expect(cloudKlein('https://i.imgur.com/a.png', 200)).toBe('https://i.imgur.com/a.png');
  expect(cloudKlein('https://res.cloudinary.com/dhn90jugp/video/upload/v1/a.mp4', 200)).toBe('https://res.cloudinary.com/dhn90jugp/video/upload/v1/a.mp4');
  expect(cloudKlein('', 200)).toBe('');
  expect(istSvg('https://x.de/a.svg#b')).toBe(true);
});
