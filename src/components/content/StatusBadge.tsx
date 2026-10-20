import { MaterialIcon } from '../ui/MaterialIcon';

/** Badge de statut M3 (app-status-badge) : classes .m3-badge + couleur (success, warning, danger, info, neutral…). */
export function StatusBadge({ label, color = 'neutral', icon }: { label: string; color?: string; icon?: string }) {
  return (
    <span style={{ display: 'inline-block' }}>
      <span className={`m3-badge ${color}`}>
        {icon && <MaterialIcon name={icon} sx={{ fontSize: 14, width: 14, height: 14 }} />}
        {label}
      </span>
    </span>
  );
}
