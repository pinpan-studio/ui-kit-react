import { useContext } from 'react';
import { ThemeModeContext, type ThemeModeState } from '../theme/themeContext';

export function useThemeMode(): ThemeModeState {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode doit être utilisé dans <ThemeModeProvider>');
  return ctx;
}
