import { useMemo } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { ThemeModeProvider } from '../theme/ThemeModeProvider';
import { buildRoutes } from './routes';

export function App() {
  const router = useMemo(() => createBrowserRouter(buildRoutes()), []);
  return (
    <ThemeModeProvider>
      <RouterProvider router={router} />
    </ThemeModeProvider>
  );
}
