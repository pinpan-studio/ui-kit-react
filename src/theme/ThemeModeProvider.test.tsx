import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { ThemeModeProvider } from './ThemeModeProvider';
import { MODE_KEY, PALETTE_KEY } from './themeContext';
import { useThemeMode } from '../hooks/useThemeMode';

function PaletteSetter() {
  const { setPalette } = useThemeMode();
  return <button onClick={() => setPalette('indigo')}>indigo</button>;
}

describe('ThemeModeProvider', () => {
  it('démarre en clair et pose light + theme-cyan sur <body>', () => {
    render(
      <ThemeModeProvider>
        <ThemeToggle />
      </ThemeModeProvider>,
    );
    expect(document.body).toHaveClass('light', 'theme-cyan');
    expect(document.body.style.getPropertyValue('--mat-sys-primary')).toBe('#006a6a');
  });

  it('bascule en sombre, persiste dans ui-kit-theme et relit la préférence au rechargement', async () => {
    const { unmount } = render(
      <ThemeModeProvider>
        <ThemeToggle />
      </ThemeModeProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Changer de thème' }));
    expect(localStorage.getItem(MODE_KEY)).toBe('dark');
    expect(document.body).toHaveClass('dark');
    expect(document.body).not.toHaveClass('light');
    expect(document.body.style.getPropertyValue('--mat-sys-primary')).toBe('#00dddd');
    unmount();
    document.body.className = '';
    render(
      <ThemeModeProvider>
        <ThemeToggle />
      </ThemeModeProvider>,
    );
    expect(document.body).toHaveClass('dark');
  });

  it('ignore une valeur stockée invalide', () => {
    localStorage.setItem(MODE_KEY, 'violet');
    render(
      <ThemeModeProvider>
        <ThemeToggle />
      </ThemeModeProvider>,
    );
    expect(document.body).toHaveClass('light');
  });

  it('change de palette et la persiste dans ui-kit-palette', async () => {
    render(
      <ThemeModeProvider>
        <PaletteSetter />
      </ThemeModeProvider>,
    );
    await userEvent.click(screen.getByText('indigo'));
    expect(localStorage.getItem(PALETTE_KEY)).toBe('indigo');
    expect(document.body).toHaveClass('theme-indigo');
    expect(document.body).not.toHaveClass('theme-cyan');
  });
});
