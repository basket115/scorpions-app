import { akzentFarben, kontrast } from './akzentfarbe';

test('HU001: dunkle Vereinsfarbe + Gelb → Gelb mit dunkler Schrift', () => {
  expect(akzentFarben('#0f1427', '#F2D400')).toEqual({ aktiv: true, flaeche: '#F2D400', schrift: '#111111', hell: true });
});

test('ohne Akzentfarbe: Vereinsfarbe mit weißer Schrift wie bisher', () => {
  for (const farbe of ['#ff0000', '#fd5e00', '#F47A1F', '#0b6631', '#336699', '#e8541a', '#2e7d32', '#6a1b9a', '#0f1427']) {
    for (const akzent of [undefined, null, '', '  ']) {
      expect(akzentFarben(farbe, akzent)).toEqual({ aktiv: false, flaeche: farbe, schrift: 'white', hell: false });
    }
  }
});

test('Akzentfarbe zählt nur bei Vereinsfarbe unter 3:1 zum Website-Hintergrund', () => {
  // Gelbe Vereinsfarbe ist auf dunklem Grund gut sichtbar → bleibt
  expect(akzentFarben('#ffd200', '#0f1427').aktiv).toBe(false);
  expect(akzentFarben('#212121', '#F2D400').aktiv).toBe(true);
});

test('dunkle Akzentfarbe → weiße Schrift', () => {
  expect(akzentFarben('#111111', '#1e3a8a')).toEqual({ aktiv: true, flaeche: '#1e3a8a', schrift: '#FFFFFF', hell: false });
});

test('ungültige Farben → wie bisher', () => {
  expect(akzentFarben('#111', '#F2D400').aktiv).toBe(false);
  expect(akzentFarben('#0f1427', 'gelb').aktiv).toBe(false);
  expect(akzentFarben('#0f1427', 42).aktiv).toBe(false);
});

test('Kontrast wie Website', () => {
  expect(kontrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
  expect(kontrast('#0f1427', '#071726')).toBeLessThan(3);
});
