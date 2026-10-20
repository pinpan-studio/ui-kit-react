import { Navigate, type RouteObject } from 'react-router';
import { RootLayout } from './RootLayout';
import { ExampleAppLayout } from '../components/layout/ExampleAppLayout';
import { KitLayout } from '../components/layout/KitLayout';
import { StandaloneLayout } from '../components/layout/StandaloneLayout';
import { isRedirect, type ComponentEntry } from '../types/routes';
import { ROUTE_TABLE } from './routeTable';

/** Formulaires présentés dans le shell d'exemple (les autres sont plein écran, comme en Angular). */
const FORMS_IN_SHELL = new Set(['contact', 'checkout', 'booking', 'application']);

type Layout = 'kit' | 'example' | 'standalone';

export function layoutFor(e: ComponentEntry): Layout {
  if (e.group === 'catalogue') return 'kit';
  if (e.group === 'app' && e.path !== '/main') return 'example';
  if (e.group === 'forms' && FORMS_IN_SHELL.has(e.path.split('/').pop() ?? '')) return 'example';
  return 'standalone';
}

const lazyPlaceholder = async () => ({
  Component: (await import('../features/placeholder/PlaceholderPage')).PlaceholderPage,
});

/** Galeries déjà portées (les autres entrées affichent le placeholder). */
const PORTED: Record<string, RouteObject['lazy']> = {
  '/ui-showcase': async () => ({
    Component: (await import('../features/catalog/ui-showcase/UiShowcasePage')).UiShowcasePage,
  }),
  '/components': async () => ({
    Component: (await import('../features/catalog/components-index/ComponentsIndexPage')).ComponentsIndexPage,
  }),
  '/components/buttons': async () => ({
    Component: (await import('../features/catalog/buttons/ButtonsGalleryPage')).ButtonsGalleryPage,
  }),
  '/components/layout': async () => ({
    Component: (await import('../features/catalog/layout/LayoutGalleryPage')).LayoutGalleryPage,
  }),
  '/components/typography': async () => ({
    Component: (await import('../features/catalog/typography/TypographyGalleryPage')).TypographyGalleryPage,
  }),
  '/components/material': async () => ({
    Component: (await import('../features/catalog/material/MaterialGalleryPage')).MaterialGalleryPage,
  }),
  '/components/navigation': async () => ({
    Component: (await import('../features/catalog/navigation/NavigationGalleryPage')).NavigationGalleryPage,
  }),
  '/components/feedback': async () => ({
    Component: (await import('../features/catalog/feedback/FeedbackGalleryPage')).FeedbackGalleryPage,
  }),
  '/components/forms': async () => ({
    Component: (await import('../features/catalog/forms/FormsGalleryPage')).FormsGalleryPage,
  }),
  '/components/fields': async () => ({
    Component: (await import('../features/catalog/fields/FieldsGalleryPage')).FieldsGalleryPage,
  }),
  '/components/data': async () => ({
    Component: (await import('../features/catalog/data/DataGalleryPage')).DataGalleryPage,
  }),
  '/components/planning': async () => ({
    Component: (await import('../features/catalog/planning/PlanningGalleryPage')).PlanningGalleryPage,
  }),
  '/components/maps': async () => ({
    Component: (await import('../features/catalog/maps/MapsGalleryPage')).MapsGalleryPage,
  }),
  '/components/media': async () => ({
    Component: (await import('../features/catalog/media/MediaGalleryPage')).MediaGalleryPage,
  }),
  '/components/interactions': async () => ({
    Component: (await import('../features/catalog/interactions/InteractionsGalleryPage')).InteractionsGalleryPage,
  }),
};

function componentRoute(e: ComponentEntry): RouteObject {
  return { path: e.path, handle: e, lazy: PORTED[e.path] ?? lazyPlaceholder };
}

/** Construit l'arbre React Router à partir de la table Angular (53 entrées). */
export function buildRoutes(): RouteObject[] {
  const children: Record<Layout, RouteObject[]> = { kit: [], example: [], standalone: [] };
  const redirects: RouteObject[] = [];
  for (const r of ROUTE_TABLE) {
    if (isRedirect(r)) {
      redirects.push({ path: r.path === '/**' ? '*' : r.path, element: <Navigate to={r.redirectTo} replace /> });
    } else {
      children[layoutFor(r)].push(componentRoute(r));
    }
  }
  return [
    {
      element: <RootLayout />,
      children: [
        { element: <KitLayout />, children: children.kit },
        { element: <ExampleAppLayout />, children: children.example },
        { element: <StandaloneLayout />, children: children.standalone },
        ...redirects,
      ],
    },
  ];
}
