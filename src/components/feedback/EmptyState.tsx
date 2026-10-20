import { Button } from '@mui/material';
import { MaterialIcon } from '../ui/MaterialIcon';
import './empty-state.scss';

/** app-empty-state. */
export function EmptyState({
  icon = 'inbox',
  title = 'Aucun résultat',
  subtitle = "Il n'y a rien à afficher pour le moment.",
  actionLabel = '',
  onAction,
}: {
  icon?: string;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty-state kit-empty-state">
      <div className="icon-wrap">
        <MaterialIcon name={icon} />
      </div>
      <h3>{title}</h3>
      <p>{subtitle}</p>
      {actionLabel && (
        <Button variant="contained" startIcon={<MaterialIcon name="add" />} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
