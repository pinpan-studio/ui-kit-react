# ui-kit-react

Portage React du **UI Kit Angular** (`ui-kit`, branche `fix/examples-responsive`, `c0789b6`) avec le même rendu Material Design 3.

Stack : Vite 6 · React 19 · TypeScript strict · MUI v6 (+ Emotion) avec un thème **Material 3 construit à la main** · React Router 7 · Vitest + React Testing Library · ESLint + Prettier.
MUI X : uniquement les paquets gratuits (MIT) le jour où ils seront nécessaires — rien d'installé à ce stade.

## Scripts

| Commande                          | Rôle                                                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                     | Serveur de développement Vite                                                                                   |
| `npm run build`                   | Vérification TypeScript (`tsc -b`) puis build de production dans `dist/`                                        |
| `npm run preview`                 | Sert le build de production                                                                                     |
| `npm run typecheck`               | Vérification TypeScript seule                                                                                   |
| `npm run lint`                    | ESLint                                                                                                          |
| `npm run format` / `format:check` | Prettier                                                                                                        |
| `npm test` / `test:watch`         | Vitest (happy-dom) + React Testing Library                                                                      |
| `npm run screenshots`             | Captures Playwright du shell (375/768/1024/1440 px, clair/sombre) — voir l'en-tête de `scripts/screenshots.mjs` |

Aucune variable d'environnement n'est requise (application 100 % statique, sans backend).

## Structure

```
src/
  app/                 App, construction du routeur, table des 53 routes Angular (routeTable.ts)
  components/
    layout/            NavShell (sidenav + barre d'outils), KitLayout, ExampleAppLayout, StandaloneLayout, nav.ts
    ui/                MaterialIcon, ThemeToggle, ThemePicker, ThemeSettings
  features/            Écrans par domaine (pour l'instant : placeholder commun à toutes les routes)
  hooks/               useThemeMode, useIsMobile
  lib/                 utilitaires (localStorage tolérant)
  theme/               tokens Angular (JSON), palettes M3, createM3Theme, variables CSS, ThemeModeProvider
  types/               types partagés
  test/                setup Vitest et helpers
scripts/               extraction des palettes Angular, captures d'écran
```

## Thème Material 3

- `src/theme/angular-design-tokens.json` : export Angular (rôles M3, typographie, formes, élévations, opacités d'état, espacements, rayons).
- `src/theme/palettes.generated.json` : les **41 palettes `theme-<id>`** (49 rôles + 2 tons bruts, clair et sombre), relevées dans le build Angular par `scripts/extract-angular-palettes.mjs`. La palette `cyan` correspond exactement à l'export de tokens.
- `createM3Theme(scheme, mode)` mappe les rôles sur la palette MUI, l'échelle typographique M3 (Inter pour le corps, Outfit pour les titres, Space Mono pour le monospace), les ombres `level0..5` et des surcharges de composants (boutons pilule 40 px, cartes, champs, app bar, tiroir, liste, switch, tooltip, menu, dialog).
- `buildCssVariables` pose sur `<body>` les mêmes variables qu'Angular : `--mat-sys-*`, `--space-*`, `--radius-*`, `--elevation-*`, et les dérivés de `styles.scss` (`--bg`, `--text-*`, `--primary-color(-light)`, `--success/--warning/--info-color(-light|-text)`…). Success / warning / info sont des couleurs fixes, comme en Angular, avec une variante `-text` en sombre.
- Mode : `light | dark | system`, enregistré dans `localStorage['ui-kit-theme']`, avec la palette dans `localStorage['ui-kit-palette']`. Les classes `light|dark` et `theme-<id>` sont posées sur `<body>`, et la synchronisation se fait entre onglets.

## Routage

Les 53 entrées de `angular-routes.json` sont déclarées : 7 redirections réelles (`<Navigate replace>`, chemins relatifs Angular résolus en absolu) et 46 routes chargées en lazy vers une page provisoire.

- Catalogue → `KitLayout` (sidenav « UI Kit »).
- `/examples/app/**`, ainsi que les formulaires contact, checkout, booking et application → `ExampleAppLayout` (sidenav « SC Storage »).
- Auth, harnais, `/main`, onboarding et survey → sans layout.
