/** Montant entier en toutes lettres (français, règles usuelles : vingt/cent au pluriel, « et un »). */
export function amountInWords(value: number): string {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return 'zéro';
  const units = [
    '',
    'un',
    'deux',
    'trois',
    'quatre',
    'cinq',
    'six',
    'sept',
    'huit',
    'neuf',
    'dix',
    'onze',
    'douze',
    'treize',
    'quatorze',
    'quinze',
    'seize',
  ];
  const tens = [
    '',
    'dix',
    'vingt',
    'trente',
    'quarante',
    'cinquante',
    'soixante',
    'soixante',
    'quatre-vingt',
    'quatre-vingt',
  ];
  const u = (i: number) => units[i] ?? '';
  const below100 = (x: number, last = true): string => {
    if (x < 17) return u(x);
    if (x < 20) return 'dix-' + u(x - 10);
    const t = Math.floor(x / 10);
    const r = x % 10;
    const tt = tens[t] ?? '';
    if (t === 7 || t === 9) return tt + (r === 1 && t === 7 ? '-et-' : '-') + below100(10 + r);
    if (r === 0) return tt + (t === 8 && last ? 's' : '');
    return tt + (r === 1 && t !== 8 ? '-et-' : '-') + u(r);
  };
  const below1000 = (x: number, last: boolean): string => {
    const h = Math.floor(x / 100);
    const r = x % 100;
    const hs = h === 0 ? '' : h === 1 ? 'cent' : u(h) + '-cent' + (r === 0 && last ? 's' : '');
    return [hs, r ? below100(r, last) : ''].filter(Boolean).join('-');
  };
  const parts: string[] = [];
  const scales: [number, string, string][] = [
    [1e9, 'milliard', 'milliards'],
    [1e6, 'million', 'millions'],
    [1e3, 'mille', 'mille'],
  ];
  let rest = n;
  for (const [v, sing, plur] of scales) {
    const q = Math.floor(rest / v);
    if (!q) continue;
    rest %= v;
    if (v === 1e3) parts.push(q === 1 ? 'mille' : below1000(q, false) + '-mille');
    else parts.push(below1000(q, true) + ' ' + (q > 1 ? plur : sing));
  }
  if (rest) parts.push(below1000(rest, true));
  const s = parts.join(' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
