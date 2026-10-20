import { Modal } from '@mui/material';
import { MaterialIcon } from '../ui/MaterialIcon';
import { Kbd } from './Kbd';
import type { Shortcut } from './types';
import './interaction.scss';

/** Aide des raccourcis clavier (app-shortcut-help), ouverte par « ? ». */
export function ShortcutHelp({
  open,
  onClose,
  shortcuts,
}: {
  open: boolean;
  onClose: () => void;
  shortcuts: Shortcut[];
}) {
  const map = new Map<string, Shortcut[]>();
  for (const s of shortcuts) {
    const g = s.group ?? 'Général';
    const items = map.get(g) ?? [];
    if (!items.some((x) => x.keys === s.keys)) items.push(s);
    map.set(g, items);
  }
  return (
    <Modal open={open} onClose={onClose}>
      <div className="kit-shortcut-panel" role="dialog" aria-label="Raccourcis clavier">
        <div className="kit-dialog-surface shortcut-help">
          <div className="sh-head">
            <MaterialIcon name="keyboard" />
            <h2>Raccourcis clavier</h2>
            <span className="spacer" />
            <button type="button" onClick={onClose} aria-label="Fermer">
              <MaterialIcon name="close" />
            </button>
          </div>
          <div className="sh-body">
            {[...map.entries()].map(([name, items]) => (
              <div key={name}>
                <h3>{name}</h3>
                <ul>
                  {items.map((s) => (
                    <li key={s.keys}>
                      <span>{s.description}</span>
                      <Kbd keys={s.keys} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="sh-foot">
            Appuyez sur <Kbd keys="shift+?" /> à tout moment pour afficher cette aide.
          </div>
        </div>
      </div>
    </Modal>
  );
}
