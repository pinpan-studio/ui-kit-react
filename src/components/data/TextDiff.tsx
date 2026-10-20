import { useMemo, useState } from 'react';
import { diffLines, type DiffLine } from '../../lib/diff';
import { MaterialIcon } from '../ui/MaterialIcon';
import './text-diff.scss';

interface Row {
  kind: 'line';
  line: DiffLine;
}
interface Fold {
  kind: 'fold';
  id: number;
  count: number;
}
interface SplitRow {
  kind: 'pair';
  left: DiffLine | null;
  right: DiffLine | null;
}

const Parts = ({ l }: { l: DiffLine }) =>
  l.parts ? (
    <>
      {l.parts.map((p, i) => (
        <span key={i} className={p.changed ? 'hl' : undefined}>
          {p.text}
        </span>
      ))}
    </>
  ) : (
    <> {l.text || ' '} </>
  );
const cls = (l: DiffLine | null) => (l ? l.op : 'empty');

/** app-text-diff : vue unifiée ou côte à côte, mots modifiés surlignés, lignes inchangées repliées autour du contexte. */
export function TextDiff({
  before = '',
  after = '',
  title = '',
  mode = 'unified',
  context = 3,
}: {
  before?: string;
  after?: string;
  title?: string;
  mode?: 'unified' | 'split';
  context?: number;
}) {
  const [view, setView] = useState(mode);
  const [opened, setOpened] = useState<Set<number>>(new Set());
  const lines = useMemo(() => diffLines(before, after), [before, after]);
  const stats = { add: lines.filter((l) => l.op === 'add').length, del: lines.filter((l) => l.op === 'del').length };
  const folds = useMemo(() => {
    const res = new Map<number, number>();
    if (context < 0) return res;
    let k = 0;
    while (k < lines.length) {
      if (lines[k]?.op !== 'equal') {
        k++;
        continue;
      }
      let e = k;
      while (e < lines.length && lines[e]?.op === 'equal') e++;
      const start = k === 0 ? 0 : k + context,
        end = e === lines.length ? e : e - context;
      if (end - start > 1) res.set(start, end - start);
      k = e;
    }
    return res;
  }, [lines, context]);
  const rows = useMemo(() => {
    const out: (Row | Fold)[] = [];
    for (let i = 0; i < lines.length; i++) {
      const f = folds.get(i);
      if (f && !opened.has(i)) {
        out.push({ kind: 'fold', id: i, count: f });
        i += f - 1;
        continue;
      }
      const line = lines[i];
      if (line) out.push({ kind: 'line', line });
    }
    return out;
  }, [lines, folds, opened]);
  const splitRows = useMemo(() => {
    const out: (SplitRow | Fold)[] = [];
    const lineAt = (i: number) => {
      const r = rows[i];
      return r?.kind === 'line' ? r.line : null;
    };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;
      if (r.kind === 'fold') {
        out.push(r);
        continue;
      }
      if (r.line.op === 'equal') {
        out.push({ kind: 'pair', left: r.line, right: r.line });
        continue;
      }
      const dels: DiffLine[] = [],
        adds: DiffLine[] = [];
      for (let l = lineAt(i); l?.op === 'del'; l = lineAt(++i)) dels.push(l);
      for (let l = lineAt(i); l?.op === 'add'; l = lineAt(++i)) adds.push(l);
      i--;
      for (let k = 0; k < Math.max(dels.length, adds.length); k++)
        out.push({ kind: 'pair', left: dels[k] ?? null, right: adds[k] ?? null });
    }
    return out;
  }, [rows]);
  const unfold = (id: number) => setOpened((s) => new Set(s).add(id));
  const foldRow = (r: Fold, i: number) => (
    <tr key={i} className="fold">
      <td colSpan={4}>
        <button type="button" onClick={() => unfold(r.id)}>
          <MaterialIcon name="unfold_more" />
          {r.count} ligne(s) identique(s)
        </button>
      </td>
    </tr>
  );

  return (
    <div className="app-text-diff">
      <div className="df">
        <div className="df-head">
          {title && <strong>{title}</strong>}
          <span className="df-stat add">+{stats.add}</span>
          <span className="df-stat del">−{stats.del}</span>
          <span className="spacer" />
          <div className="df-toggle">
            <button type="button" className={view === 'unified' ? 'on' : undefined} onClick={() => setView('unified')}>
              Unifiée
            </button>
            <button type="button" className={view === 'split' ? 'on' : undefined} onClick={() => setView('split')}>
              Côte à côte
            </button>
          </div>
        </div>
        <div className="df-body">
          {!stats.add && !stats.del ? (
            <div className="df-same">
              <MaterialIcon name="check_circle" />
              Aucune différence
            </div>
          ) : view === 'unified' ? (
            <table className="df-table">
              <tbody>
                {rows.map((r, i) =>
                  r.kind === 'fold' ? (
                    foldRow(r, i)
                  ) : (
                    <tr key={i} className={r.line.op}>
                      <td className="no">{r.line.oldNo ?? ''}</td>
                      <td className="no">{r.line.newNo ?? ''}</td>
                      <td className="sign">{r.line.op === 'add' ? '+' : r.line.op === 'del' ? '−' : ''}</td>
                      <td className="code">
                        <Parts l={r.line} />
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          ) : (
            <table className="df-table split">
              <tbody>
                {splitRows.map((r, i) =>
                  r.kind === 'fold' ? (
                    foldRow(r, i)
                  ) : (
                    <tr key={i}>
                      <td className={`no ${cls(r.left)}`}>{r.left?.oldNo ?? ''}</td>
                      <td className={`code half ${cls(r.left)}`}>{r.left && <Parts l={r.left} />}</td>
                      <td className={`no ${cls(r.right)}`}>{r.right?.newNo ?? ''}</td>
                      <td className={`code half ${cls(r.right)}`}>{r.right && <Parts l={r.right} />}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
