import { Button, Checkbox, Fab, FormControlLabel, Radio, Switch, Tooltip } from '@mui/material';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { StatusBadge } from '../../../components/content/StatusBadge';
import { useSnackbar } from '../../../components/feedback/useSnackbar';
import { COMPONENT_CATEGORIES, SHOWCASE_SECTIONS } from '../../../components/layout/nav';
import { MatProgressBar } from '../../../components/mat/MatData';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { ThemeSettings } from '../../../components/ui/ThemeSettings';
import { PAGE_REGISTRY } from '../../../data/static/pageRegistry';
import { MATERIAL_ICONS } from '../../../data/static/showcase.data';
import { useThemeMode } from '../../../hooks/useThemeMode';
import { THEME_PALETTES } from '../../../theme/paletteMeta';
import { Demo, DocPage, DocSection, type TocItem } from '../doc/Doc';
import './ui-showcase.scss';

interface Swatch {
  name: string;
  token: string;
  note?: string;
}

const TOC: TocItem[] = [
  { id: 'overview', label: 'Vue d’ensemble' },
  { id: 'themes', label: 'Thèmes' },
  { id: 'colors', label: 'Colors' },
  { id: 'typography', label: 'Typography' },
  { id: 'spacing', label: 'Espacements & rayons' },
  { id: 'icons', label: 'Icons' },
  { id: 'catalog', label: 'Catalogue' },
  { id: 'modules', label: 'Pages par module' },
];
const BRAND: Swatch[] = [
  { name: 'Primary', token: '--primary-color', note: 'M3 primary (thème courant)' },
  { name: 'Primary light', token: '--primary-color-light' },
  { name: 'Tertiary', token: '--tertiary-color', note: 'M3 tertiary (thème courant)' },
  { name: 'Tertiary light', token: '--tertiary-color-light' },
];
const SEMANTIC: Swatch[] = [
  { name: 'Success', token: '--success-color' },
  { name: 'Success light', token: '--success-color-light' },
  { name: 'Success text', token: '--success-color-text' },
  { name: 'Warning', token: '--warning-color' },
  { name: 'Warning light', token: '--warning-color-light' },
  { name: 'Warning text', token: '--warning-color-text' },
  { name: 'Error', token: '--error-color' },
  { name: 'Error light', token: '--error-color-light' },
  { name: 'Error text', token: '--error-color-text' },
  { name: 'Info', token: '--info-color' },
  { name: 'Purple', token: '--purple-color' },
  { name: 'Cyan', token: '--cyan-color' },
];
const SURFACES: Swatch[] = [
  { name: 'Background', token: '--bg' },
  { name: 'Card', token: '--card-bg' },
  { name: 'Hover', token: '--hover-bg' },
  { name: 'Table header', token: '--table-header-bg' },
  { name: 'Border', token: '--border-color' },
  { name: 'Text primary', token: '--text-primary' },
  { name: 'Text secondary', token: '--text-secondary' },
  { name: 'Text muted', token: '--text-muted' },
];
/** Rôles de couleur M3, présentés par paires « rôle / on-rôle » comme dans la documentation Material. */
const ROLES: { label: string; role: string; on: string; bordered?: boolean }[] = [
  { label: 'Primary', role: 'primary', on: 'on-primary' },
  { label: 'Primary container', role: 'primary-container', on: 'on-primary-container' },
  { label: 'Secondary', role: 'secondary', on: 'on-secondary' },
  { label: 'Secondary container', role: 'secondary-container', on: 'on-secondary-container' },
  { label: 'Tertiary', role: 'tertiary', on: 'on-tertiary' },
  { label: 'Tertiary container', role: 'tertiary-container', on: 'on-tertiary-container' },
  { label: 'Error', role: 'error', on: 'on-error' },
  { label: 'Error container', role: 'error-container', on: 'on-error-container' },
  { label: 'Surface', role: 'surface', on: 'on-surface', bordered: true },
  { label: 'Surface container', role: 'surface-container', on: 'on-surface', bordered: true },
  { label: 'Surface container highest', role: 'surface-container-highest', on: 'on-surface-variant', bordered: true },
  { label: 'Inverse surface', role: 'inverse-surface', on: 'inverse-on-surface' },
];
const SPACES = [
  ['--space-xs', '4px'],
  ['--space-s', '8px'],
  ['--space-m', '16px'],
  ['--space-l', '24px'],
  ['--space-xl', '32px'],
  ['--space-xxl', '48px'],
] as const;
const RADII = [
  ['--r-s', '4px'],
  ['--r-m', '12px'],
  ['--r-l', '24px'],
  ['--r-full', '9999px'],
] as const;
const TOTAL_PAGES = PAGE_REGISTRY.reduce((n, g) => n + g.pages.length, 0);
const TOTAL_VARIANTS = PAGE_REGISTRY.reduce(
  (n, g) => n + g.pages.reduce((m, p) => m + (p.variants?.length ?? 0), 0),
  0,
);
// Variantes M3 « tonal » et « elevated » (matButton) : jetons Angular Material appliqués au Button MUI.
const TONAL = {
  bgcolor: 'var(--mat-sys-secondary-container)',
  color: 'var(--mat-sys-on-secondary-container)',
  boxShadow: 'none',
  '&:hover': { bgcolor: 'var(--mat-sys-secondary-container)', boxShadow: 'var(--mat-sys-level1)' },
};
const ELEVATED = {
  bgcolor: 'var(--mat-sys-surface-container-low)',
  color: 'var(--mat-sys-primary)',
  boxShadow: 'var(--mat-sys-level1)',
  '&:hover': { bgcolor: 'var(--mat-sys-surface-container-low)', boxShadow: 'var(--mat-sys-level2)' },
};

/** /ui-showcase — vue d'ensemble du catalogue : couleurs, typographie, icônes, accès à tout le kit. */
export function UiShowcasePage() {
  const theme = useThemeMode();
  const snack = useSnackbar();
  const [iconQuery, setIconQuery] = useState('');
  const icons = useMemo(() => {
    const q = iconQuery.toLowerCase().trim();
    return q ? MATERIAL_ICONS.filter((i) => i.includes(q)) : MATERIAL_ICONS;
  }, [iconQuery]);
  const copy = (text: string, label = text) => {
    void navigator.clipboard?.writeText(text).catch(() => undefined);
    snack(`« ${label} » copié`, { action: 'Fermer', duration: 1500 });
  };
  const swatch = (c: Swatch, bordered = false) => (
    <button key={c.token} className="swatch" onClick={() => copy(`var(${c.token})`)}>
      <span className={`chip${bordered ? ' bordered' : ''}`} style={{ background: `var(${c.token})` }} />
      <b>{c.name}</b>
      <code>{c.token}</code>
      {c.note && <i>{c.note}</i>}
    </button>
  );
  const type = (tag: string, el: React.ReactNode) => (
    <div className="type-row">
      <span className="tag">{tag}</span>
      {el}
    </div>
  );

  return (
    <div className="gallery-ui-showcase">
      <DocPage
        title="UI Showcase"
        icon="auto_awesome_mosaic"
        eyebrow="Catalogue visuel"
        toc={TOC}
        subtitle="Vue globale du design system extrait du référentiel : jetons de couleur, typographie, icônes, composants, layouts et pages statiques. Tout fonctionne sans backend."
      >
        <section id="overview" className="overview">
          <div className="stat-row">
            <Link className="stat" to="/pages">
              <MaterialIcon name="view_quilt" />
              <b>{TOTAL_PAGES}</b>
              <span>pages statiques</span>
            </Link>
            <Link className="stat" to="/pages">
              <MaterialIcon name="layers" />
              <b>{TOTAL_VARIANTS}</b>
              <span>variantes d'état</span>
            </Link>
            <Link className="stat" to="/pages">
              <MaterialIcon name="apps" />
              <b>{PAGE_REGISTRY.length}</b>
              <span>modules</span>
            </Link>
            <Link className="stat" to="/components">
              <MaterialIcon name="widgets" />
              <b>{COMPONENT_CATEGORIES.length}</b>
              <span>catégories de composants</span>
            </Link>
          </div>
          <div className="quick-grid">
            {SHOWCASE_SECTIONS.map((s) => (
              <Link key={s.label} className="quick" to={{ pathname: s.path, hash: s.fragment }}>
                <MaterialIcon name={s.icon} />
                <span>{s.label}</span>
              </Link>
            ))}
          </div>
        </section>

        <DocSection
          id="themes"
          title="Thèmes"
          source="src/themes/_palettes.scss (généré par tools/generate-themes.mjs) · ThemeService · <app-theme-picker>"
          description={`${THEME_PALETTES.length} thèmes de couleur Material 3, chacun en clair, en sombre ou selon le réglage du système. Les palettes tonales sont calculées dans l'espace HCT à partir d'une couleur source : les rôles (primary, container, surface…) garantissent les contrastes Material quelle que soit la couleur.`}
        >
          <div className="themes-layout">
            <div className="themes-settings">
              <ThemeSettings />
            </div>
            <div className="themes-preview">
              <div className="roles">
                {ROLES.map((r) => (
                  <button
                    key={r.role}
                    className={`role${r.bordered ? ' bordered' : ''}`}
                    style={{ background: `var(--mat-sys-${r.role})`, color: `var(--mat-sys-${r.on})` }}
                    onClick={() => copy(`var(--mat-sys-${r.role})`)}
                  >
                    <b>{r.label}</b>
                    <code>--mat-sys-{r.role}</code>
                  </button>
                ))}
              </div>
              <div className="row">
                <Button variant="contained">Filled</Button>
                <Button variant="contained" sx={TONAL}>
                  Tonal
                </Button>
                <Button variant="outlined">Outlined</Button>
                <Button variant="contained" sx={ELEVATED}>
                  Elevated
                </Button>
                <Button variant="text">Text</Button>
                <Fab variant="extended">
                  <MaterialIcon name="edit" /> FAB
                </Fab>
              </div>
              <div className="row">
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Activé"
                  sx={{ ml: 0, mr: 0 }}
                  slotProps={{ typography: { sx: { fontSize: 14, letterSpacing: '0.256px', pl: '4px' } } }}
                />
                <FormControlLabel
                  control={<Checkbox defaultChecked sx={{ p: '8px' }} />}
                  label="Coché"
                  sx={{ ml: 0, mr: 0 }}
                  slotProps={{ typography: { sx: { fontSize: 14 } } }}
                />
                <FormControlLabel
                  control={<Radio defaultChecked sx={{ p: '8px' }} />}
                  label="Sélection"
                  sx={{ ml: 0, mr: 0 }}
                  slotProps={{ typography: { sx: { fontSize: 14 } } }}
                />
                <div className="themes-progress">
                  <MatProgressBar value={62} />
                </div>
              </div>
            </div>
          </div>
        </DocSection>

        <DocSection
          id="colors"
          title="Colors"
          source="styles.scss :root, .light, .dark (dérivés du thème M3 courant)"
          description="Jetons CSS définis globalement et redéfinis par le thème clair/sombre. Cliquez une pastille pour copier var(--token). Basculez le thème pour voir les valeurs sombres."
        >
          <div className="theme-switch">
            <span>
              Thème actuel : <strong>{theme.mode === 'light' ? 'clair' : 'sombre'}</strong>
            </span>
            <Button
              variant="outlined"
              startIcon={<MaterialIcon name={theme.mode === 'light' ? 'dark_mode' : 'light_mode'} />}
              onClick={theme.toggle}
            >
              Basculer
            </Button>
          </div>
          <h4 className="sub-h">Marque</h4>
          <div className="swatches">{BRAND.map((c) => swatch(c))}</div>
          <h4 className="sub-h">Sémantique</h4>
          <div className="swatches">{SEMANTIC.map((c) => swatch(c))}</div>
          <h4 className="sub-h">Surfaces & texte</h4>
          <div className="swatches">{SURFACES.map((c) => swatch(c, true))}</div>
          <h4 className="sub-h">Badges de statut</h4>
          <div className="row">
            {['success', 'warning', 'error', 'info', 'purple', 'cyan', 'neutral'].map((c) => (
              <StatusBadge key={c} label={c} color={c} />
            ))}
          </div>
        </DocSection>

        <DocSection
          id="typography"
          title="Typography"
          source="Outfit (titres) · Inter (texte) · Roboto (repli) · JetBrains Mono (codes)"
          description="Polices embarquées localement (@fontsource), aucune requête vers Google Fonts."
        >
          <div className="type-scale">
            {type('h1 · 32/700', <h1 className="t-h1">Référentiel unique</h1>)}
            {type('Titre de page · Outfit 22', <div className="t-page">Registre des Produits</div>)}
            {type('h2 · 24/600', <h2 className="t-h2">Tableau de bord Finance</h2>)}
            {type('h3 · 20/600', <h3 className="t-h3">Informations générales</h3>)}
            {type('Titre de carte · Outfit 16', <div className="t-card">Abonnement Standard</div>)}
            {type(
              'Corps · Inter 14',
              <p className="t-body">
                Le client signale une perte de signal récurrente entre 18h et 20h sur l'axe Yopougon–Abobo.
              </p>,
            )}
            {type(
              'Secondaire · 13',
              <p className="t-sec">
                Catalogue des offres : tarifs d'installation, d'abonnement et de désinstallation.
              </p>,
            )}
            {type('Libellé · 12/600', <span className="t-label">Raison sociale</span>)}
            {type('En-tête de table · 11/700', <span className="t-th">Code client</span>)}
            {type('Code · JetBrains Mono 11', <span className="t-code">FAC-2026-0912</span>)}
            {type('Montant · Mono 12', <span className="t-num">1 245 000 F CFA</span>)}
          </div>
        </DocSection>

        <DocSection id="spacing" title="Espacements & rayons" source="styles.scss :root" cols={2}>
          <Demo label="Échelle d'espacement">
            {SPACES.map(([t, v]) => (
              <button key={t} className="space-row" onClick={() => copy(`var(${t})`)}>
                <code>{t}</code>
                <span className="bar" style={{ width: `var(${t})` }} />
                <i>{v}</i>
              </button>
            ))}
          </Demo>
          <Demo label="Rayons & ombres">
            <div className="radius-row">
              {RADII.map(([t, v]) => (
                <button
                  key={t}
                  className="radius"
                  style={{ borderRadius: `var(${t})` }}
                  onClick={() => copy(`var(${t})`)}
                >
                  <code>{t}</code>
                  <i>{v}</i>
                </button>
              ))}
            </div>
            <div className="radius-row">
              <div className="shadow" style={{ boxShadow: 'var(--elevation-1)' }}>
                <code>--elevation-1</code>
              </div>
              <div className="shadow" style={{ boxShadow: 'var(--elevation-3)' }}>
                <code>--elevation-3</code>
              </div>
            </div>
          </Demo>
        </DocSection>

        <DocSection
          id="icons"
          title="Icons"
          source="Material Icons (police locale, package material-icons)"
          description="Sélection des icônes utilisées dans le projet. Cliquez pour copier la balise."
        >
          <div className="icon-search">
            <MaterialIcon name="search" />
            <input
              type="text"
              placeholder="Filtrer les icônes…"
              value={iconQuery}
              onChange={(e) => setIconQuery(e.target.value)}
            />
            <span className="muted">{icons.length} icône(s)</span>
          </div>
          <div className="icon-grid">
            {icons.map((i) => (
              <Tooltip key={i} title={i}>
                <button className="icon-cell" onClick={() => copy(`<mat-icon>${i}</mat-icon>`, i)}>
                  <MaterialIcon name={i} />
                  <span>{i}</span>
                </button>
              </Tooltip>
            ))}
          </div>
        </DocSection>

        <DocSection id="catalog" title="Catalogue" description="Accès direct aux galeries détaillées.">
          <div className="cat-grid">
            {COMPONENT_CATEGORIES.map((c) => (
              <Link key={c.path} className="cat-card" to={c.path}>
                <div className="cat-icon">
                  <MaterialIcon name={c.icon} />
                </div>
                <div className="cat-text">
                  <strong>{c.label}</strong>
                  <span>{c.description}</span>
                </div>
              </Link>
            ))}
            <Link className="cat-card" to="/layouts">
              <div className="cat-icon">
                <MaterialIcon name="view_compact" />
              </div>
              <div className="cat-text">
                <strong>Layouts</strong>
                <span>Shell applicatif, shell de module, authentification, pages publiques, catalogue.</span>
              </div>
            </Link>
            <Link className="cat-card" to="/pages">
              <div className="cat-icon">
                <MaterialIcon name="view_quilt" />
              </div>
              <div className="cat-text">
                <strong>Pages</strong>
                <span>Toutes les pages statiques de l'application, par module, avec leurs variantes.</span>
              </div>
            </Link>
          </div>
        </DocSection>

        <DocSection
          id="modules"
          title="Pages par module"
          description="Nombre de pages statiques disponibles dans chaque module."
        >
          <div className="module-grid">
            {PAGE_REGISTRY.map((g) => (
              <Link key={g.id} className="module" to={{ pathname: '/pages', hash: g.id }}>
                <MaterialIcon name={g.icon} />
                <span>{g.label}</span>
                <b>{g.pages.length}</b>
              </Link>
            ))}
          </div>
        </DocSection>
      </DocPage>
    </div>
  );
}
