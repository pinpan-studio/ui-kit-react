import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { RouteFallback } from './RouteFallback';

/** Écrans sans layout parent (auth, harnais, /main, onboarding, questionnaire). */
export function StandaloneLayout() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Outlet />
    </Suspense>
  );
}
