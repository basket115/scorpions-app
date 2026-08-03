import { resolveCustomerId, noCustomerText } from './customer';

function setUrl(search: string) {
  Object.defineProperty(window, 'location', {
    value: { search } as any,
    writable: true,
    configurable: true,
  });
}

beforeEach(() => {
  localStorage.clear();
  setUrl('');
});

test('liest ?kunde und normalisiert auf Grossbuchstaben', () => {
  setUrl('?kunde=hu001');
  expect(resolveCustomerId()).toBe('HU001');
});

test('liest ?kundenId als Kompatibilitaet', () => {
  setUrl('?kundenId=v002');
  expect(resolveCustomerId()).toBe('V002');
});

test('fehlende ID liefert null (KEIN Vereins-Fallback)', () => {
  setUrl('');
  const r = resolveCustomerId();
  expect(r).toBeNull();
  expect(r).not.toBe('V002');
  expect(r).not.toBe('DEFAULT');
});

test('ungueltige Zeichen liefern null', () => {
  setUrl('?kunde=%3Cscript%3E');
  expect(resolveCustomerId()).toBeNull();
});

test('erinnert die zuletzt selbst gewaehlte ID (kein fremder Verein)', () => {
  setUrl('?kunde=HU001');
  expect(resolveCustomerId()).toBe('HU001'); // speichert HU001
  setUrl('');
  expect(resolveCustomerId()).toBe('HU001'); // aus localStorage, nicht V002
});

test('neutraler Fehlertext je Sprache', () => {
  expect(noCustomerText('hu')).toMatch(/klub/i);
  expect(noCustomerText('de')).toMatch(/Verein/i);
});
