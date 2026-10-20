import { useMemo } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { FileViewerProvider } from '../components/media/FileViewer';
import { SnackbarProvider } from '../components/feedback/SnackbarProvider';
import { ThemeModeProvider } from '../theme/ThemeModeProvider';
import { buildRoutes } from './routes';

export function App() {
  const router = useMemo(() => createBrowserRouter(buildRoutes()), []);
  return (
    <ThemeModeProvider>
      <SnackbarProvider>
        <FileViewerProvider>
          <RouterProvider router={router} />
        </FileViewerProvider>
      </SnackbarProvider>
    </ThemeModeProvider>
  );
}
