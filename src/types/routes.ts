export type RouteGroup = 'catalogue' | 'auth' | 'app' | 'forms' | 'other';

export interface RedirectEntry {
  path: string;
  group: RouteGroup;
  redirectTo: string;
}

export interface ComponentEntry {
  path: string;
  group: RouteGroup;
  title: string | null;
  /** Composant Angular d'origine (sert de repère pour le portage). */
  angularComponent: string;
}

export type RouteEntry = RedirectEntry | ComponentEntry;

export const isRedirect = (r: RouteEntry): r is RedirectEntry => 'redirectTo' in r;
