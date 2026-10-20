import { Tooltip } from '@mui/material';
import { MaterialIcon } from '../ui/MaterialIcon';

export type ViewMode = 'card' | 'list';

/** Bascule Cartes / Liste (app-view-mode-toggle, style m3-filter-toggle). */
export function ViewModeToggle({ mode, onChange }: { mode: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="m3-filter-toggle view-mode-toggle">
      <Tooltip title="Vue cartes">
        <button type="button" className={mode === 'card' ? 'active' : undefined} onClick={() => onChange('card')}>
          <MaterialIcon name="grid_view" />
          <span>Cartes</span>
        </button>
      </Tooltip>
      <Tooltip title="Vue liste">
        <button type="button" className={mode === 'list' ? 'active' : undefined} onClick={() => onChange('list')}>
          <MaterialIcon name="view_list" />
          <span>Liste</span>
        </button>
      </Tooltip>
    </div>
  );
}
