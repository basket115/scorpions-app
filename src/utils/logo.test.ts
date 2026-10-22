import { logoOhneRand } from './logo';

test('Cloudinary-Logo bekommt e_trim', () => {
  expect(logoOhneRand('https://res.cloudinary.com/dhn90jugp/image/upload/v1792518671/zj7lai7pwpoazqbhy1gv.png'))
    .toBe('https://res.cloudinary.com/dhn90jugp/image/upload/e_trim:10/v1792518671/zj7lai7pwpoazqbhy1gv.png');
});

test('andere Adressen und schon beschnittene bleiben gleich', () => {
  expect(logoOhneRand('https://i.imgur.com/ZKh41DS.jpeg')).toBe('https://i.imgur.com/ZKh41DS.jpeg');
  expect(logoOhneRand('https://res.cloudinary.com/x/image/upload/e_trim:10/v1/a.png')).toBe('https://res.cloudinary.com/x/image/upload/e_trim:10/v1/a.png');
  expect(logoOhneRand('')).toBe('');
});
