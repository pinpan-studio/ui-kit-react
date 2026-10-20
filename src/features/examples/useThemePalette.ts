import { Chart as ChartJS, registerables } from 'chart.js';
import { useEffect, useState } from 'react';
import { useThemeMode } from '../../hooks/useThemeMode';
import { themePalette, type ThemePalette } from './exUtils';

ChartJS.register(...registerables);

/**
 * Palette du thème courant lue sur les jetons CSS, recalculée à chaque changement de mode ou de palette
 * (équivalent de l'`effect` Angular sur `theme.mode()` / `theme.label()`). `null` au premier rendu.
 */
export function useThemePalette(): ThemePalette | null {
  const { mode, label } = useThemeMode();
  const [c, setC] = useState<ThemePalette | null>(null);
  useEffect(() => {
    // Laisse le temps aux variables CSS du nouveau thème d'être posées sur <body>.
    const t = setTimeout(() => setC(themePalette()));
    return () => clearTimeout(t);
  }, [mode, label]);
  return c;
}
