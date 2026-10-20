import { fuzzyMatch } from './fuzzy';
import type { PaletteCommand } from './types';

export interface Row {
  cmd: PaletteCommand;
  hits: number[];
  group: string;
}

/** Lignes de la palette (même algorithme que CommandPaletteComponent.rows Angular). */
export function paletteRows(cmds: PaletteCommand[], recentIds: string[], query: string): Row[] {
  const q = query.trim();
  if (!q) {
    const recent = recentIds.map((id) => cmds.find((c) => c.id === id)).filter((c): c is PaletteCommand => !!c);
    return [
      ...recent.map((cmd) => ({ cmd, hits: [], group: 'Récents' })),
      ...cmds.filter((c) => !recent.includes(c)).map((cmd) => ({ cmd, hits: [], group: cmd.group ?? 'Commandes' })),
    ];
  }
  const scored = cmds
    .map((cmd) => {
      const m = fuzzyMatch(cmd.label, q);
      const k = m ? null : fuzzyMatch(`${cmd.hint ?? ''} ${(cmd.keywords ?? []).join(' ')}`, q);
      if (m) return { cmd, hits: m.hits, score: m.score + 50, group: cmd.group ?? 'Commandes' };
      if (k && k.score > 0) return { cmd, hits: [] as number[], score: k.score / 2, group: cmd.group ?? 'Commandes' };
      return null;
    })
    .filter((r): r is Row & { score: number } => !!r)
    .sort((a, b) => b.score - a.score)
    .slice(0, 40);
  return scored
    .map((r, _i, all) => ({ ...r, rank: all.findIndex((x) => x.group === r.group) }))
    .sort((a, b) => a.rank - b.rank);
}
