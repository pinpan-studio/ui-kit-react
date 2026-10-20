import { useEffect, useState } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import type { UndoOptions } from './useUndo';

export function UndoSnack({ o, duration, action }: { o: UndoOptions; duration: number; action: () => void }) {
  const [left, setLeft] = useState(Math.ceil(duration / 1000));
  useEffect(() => {
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="kit-undo">
      <MaterialIcon name={o.icon ?? 'delete'} className="u-ic" />
      <span className="u-msg">{o.message}</span>
      <button type="button" className="u-btn" onClick={action}>
        <MaterialIcon name="undo" />
        {o.actionLabel ?? 'Annuler'}
      </button>
      <span className="u-count">{left}</span>
      <i className="u-bar" style={{ animationDuration: `${duration}ms` }} />
    </div>
  );
}
