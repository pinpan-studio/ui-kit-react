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
  '/theme-studio': async () => ({
    Component: (await import('../features/catalog/theme-studio/ThemeStudioPage')).ThemeStudioPage,
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
  '/pages': async () => ({
    Component: (await import('../features/catalog/pages-gallery/PagesGalleryPage')).PagesGalleryPage,
  }),
  '/layouts': async () => ({
    Component: (await import('../features/catalog/layouts-gallery/LayoutsGalleryPage')).LayoutsGalleryPage,
  }),
  '/showcases': async () => ({
    Component: (await import('../features/catalog/showcases/ShowcasesGalleryPage')).ShowcasesGalleryPage,
  }),
  '/showcases/:id': async () => ({
    Component: (await import('../features/catalog/showcases/ShowcaseViewerPage')).ShowcaseViewerPage,
  }),
  '/examples/app/dashboard': async () => ({
    Component: (await import('../features/examples/app/dashboard/DashboardPage')).DashboardPage,
  }),
  '/examples/app/clients': async () => ({
    Component: (await import('../features/examples/app/clients/ClientsPage')).ClientsPage,
  }),
  '/examples/app/clients/:id': async () => ({
    Component: (await import('../features/examples/app/clients/ClientDetailPage')).ClientDetailPage,
  }),
  '/examples/app/inbox': async () => ({
    Component: (await import('../features/examples/app/inbox/InboxPage')).InboxPage,
  }),
  '/examples/app/catalog': async () => ({
    Component: (await import('../features/examples/app/catalog/CatalogPage')).CatalogPage,
  }),
  '/examples/app/board': async () => ({
    Component: (await import('../features/examples/app/board/BoardPage')).BoardPage,
  }),
  '/examples/app/modules': async () => ({
    Component: (await import('../features/examples/app/modules/ModulesPage')).ModulesPage,
  }),
  '/examples/app/blog': async () => ({
    Component: (await import('../features/examples/app/blog/BlogPage')).BlogPage,
  }),
  '/examples/app/blog/:slug': async () => ({
    Component: (await import('../features/examples/app/blog/ArticlePage')).ArticlePage,
  }),
  '/examples/app/docs': async () => ({
    Component: (await import('../features/examples/app/docs/DocsPage')).DocsPage,
  }),
  '/examples/app/files': async () => ({
    Component: (await import('../features/examples/app/files/FilesPage')).FilesPage,
  }),
  '/examples/app/files/columns': async () => ({
    Component: (await import('../features/examples/app/files/FilesColumnsPage')).FilesColumnsPage,
  }),
  '/examples/app/feed': async () => ({
    Component: (await import('../features/examples/app/feed/FeedPage')).FeedPage,
  }),
  '/examples/app/monitoring': async () => ({
    Component: (await import('../features/examples/app/monitoring/MonitoringPage')).MonitoringPage,
  }),
  '/examples/app/chat': async () => ({
    Component: (await import('../features/examples/app/chat/ChatPage')).ChatPage,
  }),
  '/examples/app/settings': async () => ({
    Component: (await import('../features/examples/app/settings/SettingsPage')).SettingsPage,
  }),
  '/examples/forms/contact': async () => ({
    Component: (await import('../features/examples/forms/contact/ContactFormPage')).ContactFormPage,
  }),
  '/examples/forms/checkout': async () => ({
    Component: (await import('../features/examples/forms/checkout/CheckoutFormPage')).CheckoutFormPage,
  }),
  '/examples/forms/booking': async () => ({
    Component: (await import('../features/examples/forms/booking/BookingFormPage')).BookingFormPage,
  }),
  '/examples/forms/application': async () => ({
    Component: (await import('../features/examples/forms/application/ApplicationFormPage')).ApplicationFormPage,
  }),
  '/examples/forms/onboarding': async () => ({
    Component: (await import('../features/examples/forms/onboarding/OnboardingFormPage')).OnboardingFormPage,
  }),
  '/examples/forms/survey': async () => ({
    Component: (await import('../features/examples/forms/survey/SurveyFormPage')).SurveyFormPage,
  }),
  '/examples/auth/:variant': async () => ({
    Component: (await import('../features/examples/auth/AuthPage')).AuthPage,
  }),
  '/main': async () => ({
    Component: (await import('../features/main/MainShellPage')).MainShellPage,
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
