import { appSymbol, logoOhneRand } from './logo';

test('Cloudinary-Logo bekommt e_trim', () => {
  expect(logoOhneRand('https://res.cloudinary.com/dhn90jugp/image/upload/v1792518671/zj7lai7pwpoazqbhy1gv.png'))
    .toBe('https://res.cloudinary.com/dhn90jugp/image/upload/e_trim:10/v1792518671/zj7lai7pwpoazqbhy1gv.png');
});

test('App-Symbol aus Cloudinary-Logo, sonst leer', () => {
  expect(appSymbol('https://res.cloudinary.com/dnw5rjysb/image/upload/v1783256318/onlang/iqfubqwgmntlpivqzc5w.png', 512))
    .toBe('https://res.cloudinary.com/dnw5rjysb/image/upload/e_trim:10/c_pad,w_461,h_461,b_white/c_lpad,w_512,h_512,b_white/f_png/v1783256318/onlang/iqfubqwgmntlpivqzc5w.png');
  expect(appSymbol('https://i.imgur.com/ZKh41DS.jpeg', 192)).toBe('');
  expect(appSymbol('', 192)).toBe('');
});

test('andere Adressen und schon beschnittene bleiben gleich', () => {
  expect(logoOhneRand('https://i.imgur.com/ZKh41DS.jpeg')).toBe('https://i.imgur.com/ZKh41DS.jpeg');
  expect(logoOhneRand('https://res.cloudinary.com/x/image/upload/e_trim:10/v1/a.png')).toBe('https://res.cloudinary.com/x/image/upload/e_trim:10/v1/a.png');
  expect(logoOhneRand('')).toBe('');
});
