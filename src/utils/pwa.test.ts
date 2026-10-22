import { anleitungFuer } from './pwa';

const UA = {
  iphoneSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0.6668.69 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  firefoxAndroid: 'Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
  firefoxPc: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
  samsung: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
};

test('iPhone und iPad (alle Browser): Anleitung iOS', () => {
  expect(anleitungFuer(UA.iphoneSafari, 5)).toBe('ios');
  expect(anleitungFuer(UA.iphoneChrome, 5)).toBe('ios');
  expect(anleitungFuer(UA.ipad, 5)).toBe('ios');
});

test('Instagram und Facebook (iPhone und Android): Hinweis In-App-Browser', () => {
  expect(anleitungFuer('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.29.88 (iPhone15,2; iOS 17_5; de_DE)', 5)).toBe('inapp');
  expect(anleitungFuer('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/482.0.0.48.106;FBBV/1]', 5)).toBe('inapp');
  expect(anleitungFuer('Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/482.0.0.48.106;]', 5)).toBe('inapp');
  expect(anleitungFuer('Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.0.0 Mobile Safari/537.36 Instagram 350.0.0.29.88 Android', 5)).toBe('inapp');
});

test('Firefox Android: Anleitung Firefox', () => {
  expect(anleitungFuer(UA.firefoxAndroid, 5)).toBe('firefox');
});

test('ohne Anleitung (Chrome/Samsung kommen ueber das Ereignis, Rest gar nicht)', () => {
  expect(anleitungFuer(UA.macSafari, 0)).toBeNull();
  expect(anleitungFuer(UA.firefoxPc, 0)).toBeNull();
  expect(anleitungFuer(UA.chromeAndroid, 5)).toBeNull();
  expect(anleitungFuer(UA.samsung, 5)).toBeNull();
});
