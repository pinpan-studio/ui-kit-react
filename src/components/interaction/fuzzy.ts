// Repris de command-palette.component.ts (Angular) : correspondance approchée insensible aux accents.
export function fuzzyMatch(text: string, query: string): { score: number; hits: number[] } | null {
  const norm = (s: string) =>
    s
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
  const t = norm(text);
  const q = norm(query).replace(/\s+/g, ' ').trim();
  if (!q) return { score: 0, hits: [] };
  const direct = t.indexOf(q);
  if (direct >= 0)
    return {
      score: 1000 - direct * 2 + (direct === 0 || t[direct - 1] === ' ' ? 200 : 0),
      hits: Array.from({ length: q.length }, (_, i) => direct + i),
    };
  const chars = q.replace(/ /g, '');
  const first = chars[0] ?? '';
  const wordStart = (i: number) => i === 0 || /[\s\-/·(]/.test(t[i - 1] ?? '');
  let best: { score: number; hits: number[] } | null = null;
  for (let start = t.indexOf(first); start >= 0; start = t.indexOf(first, start + 1)) {
    const hits = [start];
    let score = 10 + (wordStart(start) ? 20 : -15);
    let ti = start + 1;
    let ok = true;
    for (const ch of chars.slice(1)) {
      const next = t.indexOf(ch, ti);
      if (next < 0) {
        ok = false;
        break;
      }
      let ws = -1;
      for (let k = next; k < t.length; k++)
        if (t[k] === ch && wordStart(k)) {
          ws = k;
          break;
        }
      const pick = next === ti ? next : ws >= 0 && ws - next < 12 ? ws : next;
      score += 10 + (pick === ti ? 30 : 0) + (wordStart(pick) ? 20 : 0) - Math.min(10, (pick - ti) * 0.5);
      hits.push(pick);
      ti = pick + 1;
    }
    if (ok && (!best || score > best.score)) best = { score, hits };
  }
  return best && { score: best.score - t.length * 0.3, hits: best.hits };
}
