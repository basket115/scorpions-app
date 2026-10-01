// Vergleich mit gleicher Laufzeit unabhaengig davon, ab welchem Zeichen
// sich die Passwoerter unterscheiden.
export function gleichesPasswort(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  const laenge = Math.max(x.length, y.length);
  let unterschied = x.length ^ y.length;
  for (let i = 0; i < laenge; i++) {
    unterschied |= (x[i] ?? 0) ^ (y[i] ?? 0);
  }
  return unterschied === 0;
}
