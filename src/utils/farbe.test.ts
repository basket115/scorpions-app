import { helligkeit, istHelleFarbe, aufFarbe, alsSchrift } from './farbe';

// Diese Vereine duerfen sich nicht veraendern: weisse Schrift wie bisher.
const UNVERAENDERT: Array<[string, string]> = [
  ['V002', '#ff0000'],
  ['V006', '#fd5e00'],
  ['D001', '#0B6631'],
  ['T001', '#336699'],
  ['HU999', '#1e3a8a'],
  ['V159', '#283593'],
  ['Standard Tab1', '#b30000'],
  ['Standard App', '#111111'],
  ['Standard Kopfzeile', '#C4161C'],
];

describe('Vereine mit dunkler Farbe bleiben unveraendert', () => {
  test.each(UNVERAENDERT)('%s (%s)', (_verein, farbe) => {
    expect(istHelleFarbe(farbe)).toBe(false);
    expect(aufFarbe(farbe)).toBe('white');
    expect(aufFarbe(farbe, 0.85)).toBe('rgba(255,255,255,0.85)');
    expect(alsSchrift(farbe)).toBe(farbe);
  });
});

describe('helle Vereinsfarbe bekommt dunkle Schrift', () => {
  test('HU001 (#FFD200)', () => {
    expect(istHelleFarbe('#FFD200')).toBe(true);
    expect(aufFarbe('#FFD200')).toBe('#111111');
    expect(aufFarbe('#FFD200', 0.5)).toBe('rgba(17,17,17,0.5)');
    expect(alsSchrift('#FFD200')).toBe('#111111');
  });

  test('Weiss', () => {
    expect(aufFarbe('#ffffff')).toBe('#111111');
  });
});

describe('helligkeit', () => {
  test('Schwarz 0, Weiss 1', () => {
    expect(helligkeit('#000000')).toBe(0);
    expect(helligkeit('#ffffff')).toBeCloseTo(1, 5);
  });

  test('Kurzform und fehlende Raute', () => {
    expect(helligkeit('#fd0')).toBeCloseTo(helligkeit('#ffdd00') as number, 10);
    expect(helligkeit('FFD200')).toBeCloseTo(helligkeit('#FFD200') as number, 10);
  });

  test('ungueltige oder fehlende Farbe: alles wie bisher', () => {
    for (const wert of ['', 'gelb', '#12', undefined, null]) {
      expect(helligkeit(wert)).toBeNull();
      expect(istHelleFarbe(wert)).toBe(false);
      expect(aufFarbe(wert)).toBe('white');
    }
    expect(alsSchrift('gelb')).toBe('gelb');
  });
});
