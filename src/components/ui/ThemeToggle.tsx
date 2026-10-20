import { IconButton, Tooltip } from '@mui/material';
import { useThemeMode } from '../../hooks/useThemeMode';
import { MaterialIcon } from './MaterialIcon';

export function ThemeToggle() {
  const { mode, toggle } = useThemeMode();
  return (
    <Tooltip title="Changer de thème">
      <IconButton aria-label="Changer de thème" onClick={toggle}>
        <MaterialIcon name={mode === 'light' ? 'dark_mode' : 'light_mode'} />
      </IconButton>
    </Tooltip>
  );
}
