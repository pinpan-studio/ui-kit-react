import { Modal } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { Kbd } from './Kbd';
import { paletteRows, type Row } from './paletteRows';
import type { PaletteCommand } from './types';

function parts(r: Row): { t: string; hl: boolean }[] {
  const set = new Set(r.hits);
  const out: { t: string; hl: boolean }[] = [];
  for (let i = 0; i < r.cmd.label.length; i++) {
    const hl = set.has(i);
    const last = out[out.length - 1];
    if (last && last.hl === hl) last.t += r.cmd.label[i];
    else out.push({ t: r.cmd.label[i] ?? '', hl });
  }
  return out;
}

/** Palette de commandes (⌘K / Ctrl+K) — rendu de app-command-palette. */
export function CommandPalette({
  open,
  onClose,
  commands,
  recent,
  onRun,
}: {
  open: boolean;
  onClose: () => void;
  commands: PaletteCommand[];
  recent: string[];
  onRun: (c: PaletteCommand) => void;
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const rows = useMemo(() => paletteRows(commands, recent, query), [commands, recent, query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView?.({ block: 'nearest' });
  }, [active]);

  const onKey = (e: React.KeyboardEvent) => {
    const n = rows.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % Math.max(1, n));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + n) % Math.max(1, n));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const r = rows[active];
      if (r) onRun(r.cmd);
    }
  };

  return (
    <Modal open={open} onClose={onClose} slotProps={{ backdrop: { className: 'kit-palette-backdrop' } }}>
      <div className="kit-palette-panel" role="dialog" aria-label="Palette de commandes">
        <div className="kit-dialog-surface">
          <div className="cp">
            <div className="cp-search">
              <MaterialIcon name="search" />
              <input
                autoFocus
                placeholder="Rechercher une page, une action…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKey}
                aria-label="Rechercher une commande"
                role="combobox"
                aria-expanded="true"
                aria-controls="cp-list"
              />
              <Kbd keys="esc" className="kbd-keys" />
            </div>
            <div className="cp-list" id="cp-list" role="listbox" ref={listRef}>
              {rows.map((r, i) => (
                <div key={r.cmd.id} style={{ display: 'contents' }}>
                  {(i === 0 || rows[i - 1]?.group !== r.group) && <div className="cp-group">{r.group}</div>}
                  <div
                    className={`cp-item${i === active ? ' active' : ''}`}
                    role="option"
                    aria-selected={i === active}
                    data-i={i}
                    onClick={() => onRun(r.cmd)}
                    onMouseMove={() => setActive(i)}
                  >
                    <span className="cp-ic">
                      <MaterialIcon name={r.cmd.icon || 'chevron_right'} />
                    </span>
                    <span className="cp-text">
                      <span className="cp-label">
                        {parts(r).map((p, j) => (
                          <span key={j} className={p.hl ? 'hl' : undefined}>
                            {p.t}
                          </span>
                        ))}
                      </span>
                      {r.cmd.hint && <span className="cp-hint">{r.cmd.hint}</span>}
                    </span>
                    {r.cmd.shortcut && <Kbd keys={r.cmd.shortcut} className="kbd-keys" />}
                    {i === active && <MaterialIcon name="keyboard_return" className="cp-enter" />}
                  </div>
                </div>
              ))}
              {!rows.length && (
                <div className="cp-empty">
                  <MaterialIcon name="search_off" />
                  <strong>Aucun résultat</strong>
                  <span>Essayez un autre mot-clé.</span>
                </div>
              )}
            </div>
            <div className="cp-foot">
              <span>
                <Kbd keys="up" />
                <Kbd keys="down" /> naviguer
              </span>
              <span>
                <Kbd keys="enter" /> ouvrir
              </span>
              <span className="spacer" />
              <span>{rows.length} résultat(s)</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
