import { buildCssVariables } from '../../../theme/cssVariables';
import { getScheme, PALETTE_IDS } from '../../../theme/palettes';
/* eslint-disable @typescript-eslint/no-non-null-assertion -- index connus (rôles M3, palettes non vides) */
import {
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { StatusBadge } from '../../../components/content/StatusBadge';
import { Trend } from '../../../components/data/Trend';
import { Banner } from '../../../components/feedback/Banner';
import { useSnackbar } from '../../../components/feedback/useSnackbar';
import { ColorPicker } from '../../../components/fields/ColorPicker';
import { CurrencyInput } from '../../../components/fields/CurrencyInput';
import { NumberStepper } from '../../../components/fields/NumberStepper';
import { Rating } from '../../../components/fields/Rating';
import { FilterDropdown, type FilterOption } from '../../../components/forms/FilterDropdown';
import { SearchableSelect, type SelectOption } from '../../../components/forms/SearchableSelect';
import { ViewModeToggle, type ViewMode } from '../../../components/interaction/ViewModeToggle';
import { MatBadgeContent, MatChipListbox } from '../../../components/mat/MatData';
import { matBadgeClass } from '../../../components/mat/matUtils';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { useThemeMode } from '../../../hooks/useThemeMode';
import {
  CONTRAST_LEVELS,
  OVERRIDABLE_ROLES,
  SCHEME_STYLES,
  contrastRatio,
  cssVariablesFor,
  derivedKeyColors,
  exportCss,
  isHexColor,
  normalizeConfig,
  paletteStrips,
  schemeColors,
  type CustomThemeConfig,
  type OverridableRole,
  type SchemeStyle,
} from '../../../theme/customTheme';
import { THEME_PALETTES } from '../../../theme/paletteMeta';
import { DocPage, DocSection, type TocItem } from '../doc/Doc';
import './theme-studio.scss';

const TOC: TocItem[] = [
  { id: 'compose', label: 'Composer' },
  { id: 'tones', label: 'Nuances' },
  { id: 'roles', label: 'Rôles & contrastes' },
];
const SEEDS = THEME_PALETTES.map((p) => p.seed);
const STATUS_OPTIONS: FilterOption<string | null>[] = [
  { value: 'actif', label: 'Actif', color: 'success' },
  { value: 'suspendu', label: 'Suspendu', color: 'warning' },
  { value: 'resilie', label: 'Résilié', color: 'error' },
];
const TYPE_OPTIONS: SelectOption<string>[] = [
  { value: 'install', label: 'Installation balise', icon: 'build' },
  { value: 'maintenance', label: 'Maintenance', icon: 'handyman' },
  { value: 'retrait', label: 'Retrait', icon: 'remove_circle_outline' },
];
const ROLE_PAIRS = [
  { label: 'Primary', role: 'primary', on: 'on-primary' },
  { label: 'Primary container', role: 'primary-container', on: 'on-primary-container' },
  { label: 'Secondary', role: 'secondary', on: 'on-secondary' },
  { label: 'Secondary container', role: 'secondary-container', on: 'on-secondary-container' },
  { label: 'Tertiary', role: 'tertiary', on: 'on-tertiary' },
  { label: 'Tertiary container', role: 'tertiary-container', on: 'on-tertiary-container' },
  { label: 'Error', role: 'error', on: 'on-error' },
  { label: 'Error container', role: 'error-container', on: 'on-error-container' },
  { label: 'Surface', role: 'surface', on: 'on-surface' },
  { label: 'Surface container low', role: 'surface-container-low', on: 'on-surface' },
  { label: 'Surface container', role: 'surface-container', on: 'on-surface' },
  { label: 'Surface container highest', role: 'surface-container-highest', on: 'on-surface-variant' },
  { label: 'Inverse surface', role: 'inverse-surface', on: 'inverse-on-surface' },
  { label: 'Primary fixed', role: 'primary-fixed', on: 'on-primary-fixed' },
  { label: 'Secondary fixed', role: 'secondary-fixed', on: 'on-secondary-fixed' },
  { label: 'Tertiary fixed', role: 'tertiary-fixed', on: 'on-tertiary-fixed' },
];
const EXTRA_ROLES = ['outline', 'outline-variant', 'surface-dim', 'surface-bright', 'inverse-primary', 'surface-tint'];
const LABEL_SX = { ml: 0, mr: 0 };
const LABEL_TYPO = { typography: { sx: { fontSize: 14, letterSpacing: '0.256px', pl: '4px' } } };

const toHex = (hex: string) => {
  const v = hex.trim().toLowerCase();
  return /^#?[0-9a-f]{6}$/.test(v) ? (v.startsWith('#') ? v : '#' + v) : null;
};
const toneInk = (tone: number) => (tone < 55 ? '#ffffff' : '#000000');

// Jetons dérivés (--card-bg, --text-*, --*-color-text, --tone-*…) redéclarés dans l'aperçu pour suivre ses rôles M3
// et son color-scheme (light-dark) : sinon ils gardent les valeurs du mode de la page.
const derivedVars = (mode: 'light' | 'dark') =>
  Object.fromEntries(
    Object.entries(buildCssVariables(getScheme(PALETTE_IDS[0] ?? '', mode), mode)).filter(
      ([k]) => !k.startsWith('--mat-sys-'),
    ),
  );

function Device({ mode, vars }: { mode: 'light' | 'dark'; vars: Record<string, string> }) {
  const [status, setStatus] = useState<string | null>('actif');
  const [view, setView] = useState<ViewMode>('card');
  const [type, setType] = useState<string | null>('install');
  const [amount, setAmount] = useState<number | null>(250000);
  const [qty, setQty] = useState(6);
  return (
    <figure className="device-wrap">
      <figcaption>
        <MaterialIcon name={mode === 'dark' ? 'dark_mode' : 'light_mode'} /> {mode === 'dark' ? 'Sombre' : 'Clair'}
      </figcaption>
      <div className={`device ${mode}`} style={{ ...derivedVars(mode), ...vars, colorScheme: mode } as CSSProperties}>
        <div className="pv-appbar">
          <MaterialIcon name="menu" />
          <span className="pv-title">Clients</span>
          <IconButton aria-label="Notifications">
            <span className={`material-icons mat-icon ${matBadgeClass('warn')}`}>
              notifications<MatBadgeContent>3</MatBadgeContent>
            </span>
          </IconButton>
          <span className="pv-avatar">JK</span>
        </div>
        <div className="pv-body">
          <div className="kpi-grid pv-kpis">
            <div className="kpi-card">
              <div className="kpi-icon indigo">
                <MaterialIcon name="people" />
              </div>
              <div className="kpi-content">
                <span className="kpi-value">434</span>
                <span className="kpi-label">Clients actifs</span>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon success">
                <MaterialIcon name="payments" />
              </div>
              <div className="kpi-content">
                <span className="kpi-value">
                  12,4 <small>M F</small>
                </span>
                <span className="kpi-label">
                  CA du mois <Trend value={18} />
                </span>
              </div>
            </div>
          </div>
          <div className="m3-search-bar-unified">
            <div className="search-input-wrapper">
              <MaterialIcon name="search" className="search-icon" />
              <input type="text" placeholder="Rechercher un client…" />
            </div>
            <div className="divider" />
            <FilterDropdown options={STATUS_OPTIONS} value={status} onChange={setStatus} labelPrefix="Statut" />
          </div>
          <ViewModeToggle mode={view} onChange={setView} />
          <div className="m3-card entity-card">
            <div className="card-header">
              <div className="card-icon-box icon-blue">
                <MaterialIcon name="business" />
              </div>
              <StatusBadge label="ACTIF" color="success" />
            </div>
            <div className="card-body">
              <div className="card-title-area">
                <span className="code-tag">CLI-1042</span>
                <h3 className="card-title">Transports Yao &amp; Fils</h3>
                <p className="card-desc">Logistique · Abidjan</p>
              </div>
              <div className="card-info-list">
                <div className="info-item">
                  <MaterialIcon name="person" />
                  <span className="info-label">Contact :</span>
                  <span className="info-val">Awa Koné</span>
                </div>
                <div className="info-item">
                  <MaterialIcon name="directions_car" />
                  <span className="info-label">Véhicules :</span>
                  <span className="info-val font-bold">24</span>
                </div>
              </div>
            </div>
            <div className="card-footer">
              <IconButton className="action-icon-btn" aria-label="Options">
                <MaterialIcon name="more_vert" />
              </IconButton>
              <Button className="detail-btn" endIcon={<MaterialIcon name="arrow_forward" />}>
                Fiche client
              </Button>
            </div>
          </div>
          <Banner tone="info" title="Synchronisation planifiée" dismissible={false} compact>
            Prochaine synchronisation ce soir à 22:00.
          </Banner>
          <div className="m3-card pv-form">
            <h3 className="pv-form-title">Nouvelle intervention</h3>
            <div className="form-field">
              <label className="field-label">Raison sociale</label>
              <div className="field-box">
                <MaterialIcon name="business" />
                <input defaultValue="Transports Yao & Fils" />
              </div>
            </div>
            <div className="form-field">
              <label className="field-label">Type</label>
              <SearchableSelect
                options={TYPE_OPTIONS}
                value={type}
                onChange={setType}
                icon="category"
                placeholder="Type d'intervention"
              />
            </div>
            <div className="form-field">
              <label className="field-label">Montant</label>
              <CurrencyInput value={amount} onChange={setAmount} />
            </div>
            <div className="pv-two">
              <div className="form-field">
                <label className="field-label">Balises</label>
                <NumberStepper value={qty} onChange={setQty} min={0} max={50} compact />
              </div>
              <div className="form-field">
                <label className="field-label">Satisfaction</label>
                <Rating value={4} readonly size="small" />
              </div>
            </div>
            <div className="form-field">
              <label className="field-label">Email</label>
              <div className="field-box field-invalid">
                <MaterialIcon name="alternate_email" />
                <input defaultValue="jean.kouassi@" />
              </div>
              <span className="field-error">Adresse email invalide</span>
            </div>
            <div className="pv-checks">
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Notifier le client"
                sx={LABEL_SX}
                slotProps={LABEL_TYPO}
              />
              <FormControlLabel
                control={<Checkbox defaultChecked sx={{ p: '8px' }} />}
                label="Urgent"
                sx={LABEL_SX}
                slotProps={LABEL_TYPO}
              />
            </div>
            <div className="pv-badges">
              <StatusBadge label="En cours" color="info" />
              <StatusBadge label="En retard" color="warning" />
              <StatusBadge label="Annulée" color="error" />
              <StatusBadge label="Brouillon" color="neutral" />
            </div>
            <div className="pv-actions">
              <Button variant="outlined">Annuler</Button>
              <Button variant="contained" startIcon={<MaterialIcon name="check" />}>
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}

/** /theme-studio — compose un thème M3 (port de showcase/theme-studio). */
export function ThemeStudioPage() {
  const theme = useThemeMode();
  const snack = useSnackbar();
  const seedOf = () => THEME_PALETTES.find((p) => p.id === theme.paletteId)?.seed ?? SEEDS[0]!;
  const [draft, setDraft] = useState<CustomThemeConfig>(
    () => theme.custom ?? normalizeConfig({ source: seedOf() }, seedOf()),
  );
  const [live, setLive] = useState(false);
  const [rolesMode, setRolesMode] = useState<'light' | 'dark'>(theme.mode);

  const { applyCustom } = theme;
  useEffect(() => {
    if (live) applyCustom(draft);
  }, [live, draft, applyCustom]);

  const styleInfo = SCHEME_STYLES.find((s) => s.id === draft.style)!;
  const previewVars = useMemo(
    () => ({ light: cssVariablesFor(draft, false), dark: cssVariablesFor(draft, true) }),
    [draft],
  );
  const strips = useMemo(() => paletteStrips(draft), [draft]);
  const derived = useMemo(() => derivedKeyColors(draft), [draft]);
  const scheme = useMemo(() => schemeColors(draft, rolesMode === 'dark'), [draft, rolesMode]);
  const roleColors = ROLE_PAIRS.map((p) => {
    const bg = scheme[p.role]!;
    const fg = scheme[p.on]!;
    return { ...p, bg, fg, ratio: contrastRatio(bg, fg) };
  });

  const update = (patch: Partial<CustomThemeConfig>) => setDraft((d) => ({ ...d, ...patch }));
  const setSource = (hex: string) => {
    const full = toHex(hex);
    if (full) update({ source: full });
  };
  const isOverridden = (r: OverridableRole) => !!draft.overrides[r];
  const roleColor = (r: OverridableRole) => draft.overrides[r] ?? derived[r];
  const toggleOverride = (r: OverridableRole, on: boolean) => {
    const rest = Object.fromEntries(Object.entries(draft.overrides).filter(([k]) => k !== r));
    update({ overrides: on ? { ...rest, [r]: derived[r] } : rest });
  };
  const setOverride = (r: OverridableRole, hex: string) => {
    const full = toHex(hex);
    if (!isHexColor(full)) return;
    update({ overrides: { ...draft.overrides, [r]: full } });
  };
  const randomize = () => {
    const h = Math.random() * 360,
      s = 0.55 + Math.random() * 0.35,
      l = 0.4 + Math.random() * 0.2;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const c = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      return Math.round(c * 255)
        .toString(16)
        .padStart(2, '0');
    };
    update({ source: `#${f(0)}${f(8)}${f(4)}` });
  };
  const copy = (text: string, label = text) => {
    void navigator.clipboard?.writeText(text);
    snack(`« ${label} » copié`, { action: 'Fermer', duration: 1500 });
  };
  const apply = () => {
    applyCustom(draft);
    snack('Thème personnalisé appliqué à tout le kit', { action: 'Fermer', duration: 2000 });
  };

  return (
    <DocPage
      title="Studio de thème"
      icon="tune"
      eyebrow="Thèmes Material 3"
      subtitle="Choisissez une couleur, un style et un contraste, imposez si besoin vos couleurs secondary, tertiary, neutres ou error : le schéma M3 complet se compose en direct, en clair comme en sombre."
      toc={TOC}
      className="gallery-theme-studio"
    >
      <DocSection
        id="compose"
        title="Composer"
        source="core/theme/custom-theme.ts · @material/material-color-utilities (DynamicScheme)"
      >
        <div className="studio">
          <div className="controls">
            <div className="panel">
              <h3 className="panel-title">
                Couleur source <span className="muted">primary</span>
              </h3>
              <div className="source-row">
                <div className="grow">
                  <ColorPicker swatches={SEEDS} value={draft.source} onChange={setSource} />
                </div>
                <Tooltip title="Couleur au hasard">
                  <IconButton onClick={randomize} aria-label="Couleur au hasard">
                    <MaterialIcon name="casino" />
                  </IconButton>
                </Tooltip>
              </div>
              <span className="sub-label">Couleurs rapides</span>
              <ColorPicker inline swatches={SEEDS} value={draft.source} onChange={setSource} />
            </div>

            <div className="panel">
              <h3 className="panel-title">
                Style <span className="muted">{styleInfo.label}</span>
              </h3>
              <MatChipListbox<SchemeStyle>
                className="styles"
                value={draft.style}
                onChange={(style) => update({ style })}
                options={SCHEME_STYLES.map((s) => ({ value: s.id, label: s.label }))}
                aria-label="Style du schéma"
              />
              <p className="hint">{styleInfo.description}</p>
              <Button
                variant="outlined"
                className="mono-btn"
                startIcon={<MaterialIcon name="contrast" />}
                onClick={() => update({ style: 'monochrome', overrides: {} })}
              >
                Noir &amp; blanc
              </Button>
            </div>

            <div className="panel">
              <h3 className="panel-title">Contraste</h3>
              <ToggleButtonGroup
                exclusive
                className="m3-segmented full"
                value={draft.contrast}
                onChange={(_, c: number | null) => c !== null && update({ contrast: c })}
                aria-label="Niveau de contraste"
              >
                {CONTRAST_LEVELS.map((c) => (
                  <ToggleButton key={c.value} value={c.value}>
                    {c.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <p className="hint">
                Les niveaux Moyen et Élevé renforcent l'écart entre chaque rôle et son « on- » (accessibilité, réglage
                système Android).
              </p>
            </div>

            <div className="panel">
              <h3 className="panel-title">
                Couleurs des rôles <span className="muted">auto = dérivée de la source</span>
              </h3>
              {OVERRIDABLE_ROLES.map((r) => (
                <div key={r.id} className={`role-row${isOverridden(r.id) ? ' on' : ''}`}>
                  <div className="role-head">
                    <div className="role-text">
                      <b>{r.label}</b>
                      <span>{r.hint}</span>
                    </div>
                    <Switch
                      checked={isOverridden(r.id)}
                      onChange={(e) => toggleOverride(r.id, e.target.checked)}
                      slotProps={{ input: { 'aria-label': 'Imposer la couleur ' + r.label } }}
                    />
                  </div>
                  <ColorPicker
                    swatches={SEEDS}
                    value={roleColor(r.id)}
                    disabled={!isOverridden(r.id)}
                    onChange={(v) => setOverride(r.id, v)}
                  />
                </div>
              ))}
            </div>

            <div className="panel actions">
              <FormControlLabel
                control={<Switch checked={live} onChange={(e) => setLive(e.target.checked)} />}
                label="Appliquer en direct à tout le kit"
                sx={LABEL_SX}
                slotProps={LABEL_TYPO}
              />
              <div className="action-row">
                <Button variant="contained" startIcon={<MaterialIcon name="check" />} onClick={apply}>
                  Appliquer au kit
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<MaterialIcon name="content_copy" />}
                  onClick={() => copy(exportCss(draft), 'CSS du thème')}
                >
                  CSS
                </Button>
                <Button
                  startIcon={<MaterialIcon name="data_object" />}
                  onClick={() => copy(JSON.stringify(draft, null, 2), 'Configuration JSON')}
                >
                  JSON
                </Button>
                <Button
                  startIcon={<MaterialIcon name="restart_alt" />}
                  onClick={() => setDraft(normalizeConfig({ source: seedOf() }, seedOf()))}
                >
                  Réinitialiser
                </Button>
              </div>
              {theme.isCustom && (
                <p className="hint">
                  <MaterialIcon name="info" className="inline" /> Le kit utilise actuellement votre thème personnalisé.
                </p>
              )}
            </div>
          </div>

          <div className="previews">
            <Device mode="light" vars={previewVars.light} />
            <Device mode="dark" vars={previewVars.dark} />
          </div>
        </div>
      </DocSection>

      <DocSection
        id="tones"
        title="Nuances"
        source="TonalPalette.tone(0 → 100)"
        description="Chaque palette tonale du thème, du noir (0) au blanc (100). Les rôles M3 piochent dans ces tons (ex. primary = 40 en clair, 80 en sombre en style standard). Cliquez une nuance pour copier son code."
      >
        <div className="strips">
          {strips.map((p) => (
            <div key={p.key} className="strip">
              <div className="strip-label">
                <span className="key" style={{ background: p.keyColor }} />
                <b>{p.label}</b>
                <code>{p.keyColor}</code>
              </div>
              <div className="strip-tones">
                {p.tones.map((t) => (
                  <Tooltip key={t.tone} title={`${p.label} ${t.tone} · ${t.hex}`}>
                    <button
                      type="button"
                      className="tone"
                      style={{ background: t.hex, color: toneInk(t.tone) }}
                      onClick={() => copy(t.hex)}
                    >
                      {t.tone}
                    </button>
                  </Tooltip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection
        id="roles"
        title="Rôles & contrastes"
        source="--mat-sys-*"
        description="Paires « rôle / on-rôle » résolues pour le mode choisi, avec leur ratio de contraste WCAG (AA texte : 4,5:1)."
      >
        <ToggleButtonGroup
          exclusive
          className="m3-segmented roles-mode"
          value={rolesMode}
          onChange={(_, m: 'light' | 'dark' | null) => m && setRolesMode(m)}
          aria-label="Mode des rôles"
        >
          <ToggleButton value="light">
            <MaterialIcon name="light_mode" /> Clair
          </ToggleButton>
          <ToggleButton value="dark">
            <MaterialIcon name="dark_mode" /> Sombre
          </ToggleButton>
        </ToggleButtonGroup>
        <div className="role-grid">
          {roleColors.map((r) => (
            <button
              key={r.role}
              type="button"
              className="role-card"
              style={{ background: r.bg, color: r.fg }}
              onClick={() => copy('var(--mat-sys-' + r.role + ')')}
            >
              <b>{r.label}</b>
              <span className={`ratio${r.ratio < 4.5 ? ' low' : ''}`}>{r.ratio.toFixed(1)}:1</span>
              <code>
                {r.bg} / {r.fg}
              </code>
            </button>
          ))}
        </div>
        <div className="extra-roles">
          {EXTRA_ROLES.map((role) => (
            <button key={role} type="button" className="extra" onClick={() => copy(scheme[role]!)}>
              <span style={{ background: scheme[role] }} />
              <code>{role}</code>
              <code className="muted">{scheme[role]}</code>
            </button>
          ))}
        </div>
      </DocSection>
    </DocPage>
  );
}
