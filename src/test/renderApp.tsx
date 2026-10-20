import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { buildRoutes } from '../app/routes';
import { ThemeModeProvider } from '../theme/ThemeModeProvider';

export function renderAt(path: string) {
  const router = createMemoryRouter(buildRoutes(), { initialEntries: [path] });
  const utils = render(
    <ThemeModeProvider>
      <RouterProvider router={router} />
    </ThemeModeProvider>,
  );
  return { router, ...utils };
}
