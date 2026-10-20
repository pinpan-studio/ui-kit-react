import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { buildRoutes } from '../app/routes';
import { SnackbarProvider } from '../components/feedback/SnackbarProvider';
import { ThemeModeProvider } from '../theme/ThemeModeProvider';

export function renderAt(path: string) {
  const router = createMemoryRouter(buildRoutes(), { initialEntries: [path] });
  const utils = render(
    <ThemeModeProvider>
      <SnackbarProvider>
        <RouterProvider router={router} />
      </SnackbarProvider>
    </ThemeModeProvider>,
  );
  return { router, ...utils };
}
