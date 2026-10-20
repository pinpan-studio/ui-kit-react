import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { RouteFallback } from './RouteFallback';
import './standalone.css';

/**
 * Écrans sans layout parent (auth, harnais, /main, onboarding, questionnaire). Comme dans Angular, la page
 * est rendue dans la carte racine de l'application (app-root > mat-card) : colonne flex pleine hauteur.
 */
export function StandaloneLayout() {
  return (
    <div className="standalone-card">
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </div>
  );
}
