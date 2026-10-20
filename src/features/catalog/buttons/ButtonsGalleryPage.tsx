import {
  Badge,
  Button,
  CircularProgress,
  Divider,
  Fab,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useSnackbar } from '../../../components/feedback/useSnackbar';
import { ViewModeToggle, type ViewMode } from '../../../components/interaction/ViewModeToggle';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { Demo, DocPage, DocSection, type TocItem } from '../doc/Doc';
import { BUTTONS_CODE as code } from './buttonsCode';
import './buttons-gallery.scss';

const TOC: TocItem[] = [
  { id: 'variants', label: 'Variantes' },
  { id: 'states', label: 'États' },
  { id: 'icon', label: 'Icon buttons' },
  { id: 'header', label: 'Actions de page' },
  { id: 'segmented', label: 'Segmentés & toggles' },
  { id: 'menu', label: 'Menu & split' },
  { id: 'fab', label: 'FAB' },
  { id: 'sizes', label: 'Tailles & formes' },
];

const I = (name: string) => <MaterialIcon name={name} />;

/** Galerie /components/buttons — variantes de boutons du projet (ButtonsGalleryComponent). */
export function ButtonsGalleryPage() {
  const snack = useSnackbar();
  const [loading, setLoading] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [tab, setTab] = useState('mois');
  const [period, setPeriod] = useState('month');
  const [toggle, setToggle] = useState('day');
  const [exportMenu, setExportMenu] = useState<HTMLElement | null>(null);
  const [splitMenu, setSplitMenu] = useState<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const simulate = (key: string) => {
    setLoading(key);
    timer.current = setTimeout(() => {
      setLoading(null);
      snack('Action simulée — aucune requête envoyée', { duration: 2000 });
    }, 1400);
  };

  return (
    <DocPage
      title="Boutons"
      icon="smart_button"
      className="gallery-buttons"
      subtitle="Boutons Angular Material M3 tels qu'utilisés dans le projet (mat-flat-button primaire majoritaire, mat-raised-button « create-btn » des en-têtes de liste, mat-stroked-button, bouton warn) et classes maison (refresh-btn, action-icon-btn, detail-btn, toggles segmentés)."
      toc={TOC}
    >
      <DocSection
        id="variants"
        title="Variantes"
        source='mat-flat-button · mat-stroked-button · mat-button · color="warn"'
        description="Correspondance : Primary = mat-flat-button primaire ; Secondary = mat-stroked-button primaire ; Outline = mat-stroked-button neutre ; Ghost = mat-button ; Danger = warn. « Success » est une variante dérivée des jetons --success-color (pas de bouton vert dédié dans l'original)."
      >
        <Demo label="Toutes les variantes" code={code.variants}>
          <div className="row lg">
            <Button variant="contained">Primary</Button>
            <Button variant="contained" disableElevation={false}>
              Raised
            </Button>
            <Button variant="outlined">Secondary</Button>
            <Button variant="outlined" color="inherit">
              Outline
            </Button>
            <Button variant="text">Ghost</Button>
            <Button variant="contained" color="error">
              Danger
            </Button>
            <Button variant="outlined" color="error">
              Danger outline
            </Button>
            <Button variant="contained" className="btn-success">
              Success
            </Button>
            <Button variant="contained" color="secondary">
              Tertiary
            </Button>
          </div>
        </Demo>
        <Demo label="Avec icône (Icon + Text)">
          <div className="row lg">
            <Button variant="contained" startIcon={I('save')}>
              Enregistrer
            </Button>
            <Button variant="outlined" startIcon={I('edit')}>
              Modifier
            </Button>
            <Button variant="outlined" color="inherit" startIcon={I('file_download')}>
              Exporter
            </Button>
            <Button variant="text" startIcon={I('visibility')}>
              Voir
            </Button>
            <Button variant="outlined" color="error" startIcon={I('delete')}>
              Supprimer
            </Button>
            <Button variant="contained" className="btn-success" startIcon={I('check_circle')}>
              Valider
            </Button>
            <Button variant="text" className="detail-btn" endIcon={I('arrow_forward')}>
              Fiche produit
            </Button>
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="states"
        title="États"
        description="Disabled, loading (spinner intégré, cliquable pour simuler), focus clavier."
        cols={2}
      >
        <Demo label="Disabled">
          <div className="row">
            <Button variant="contained" disabled>
              Primary
            </Button>
            <Button variant="outlined" color="inherit" disabled>
              Outline
            </Button>
            <Button variant="text" disabled>
              Ghost
            </Button>
            <IconButton disabled aria-label="Supprimer">
              {I('delete')}
            </IconButton>
          </div>
        </Demo>
        <Demo label="Loading" hint="cliquez" code={code.loading}>
          <div className="row">
            <Button
              variant="contained"
              disabled={loading === 'save'}
              onClick={() => simulate('save')}
              startIcon={loading === 'save' ? <CircularProgress size={18} color="inherit" /> : I('save')}
            >
              {loading === 'save' ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
            <Button
              variant="outlined"
              disabled={loading === 'sync'}
              onClick={() => simulate('sync')}
              startIcon={<MaterialIcon name="sync" className={loading === 'sync' ? 'spin' : undefined} />}
            >
              Synchroniser
            </Button>
            <Tooltip title="Rafraîchir">
              <IconButton className="refresh-btn" onClick={() => simulate('refresh')} aria-label="Rafraîchir">
                <MaterialIcon name="refresh" className={loading === 'refresh' ? 'spin' : undefined} />
              </IconButton>
            </Tooltip>
          </div>
        </Demo>
        <Demo label="Pleine largeur (dialogs, auth)">
          <div className="col">
            <Button variant="contained" className="w-100">
              Accepter et Continuer
            </Button>
            <Button variant="outlined" className="w-100 mat-button-rounded">
              Connectez-vous par e-mail
            </Button>
          </div>
        </Demo>
        <Demo label="Connexion Google">
          <Button variant="contained" disableElevation={false} startIcon={I('login')}>
            Se connecter avec Google
          </Button>
        </Demo>
      </DocSection>

      <DocSection id="icon" title="Icon buttons" source=".action-icon-btn · .refresh-btn · mat-icon-button" cols={3}>
        <Demo label="Icon button" code={code.icon}>
          <div className="row">
            <Tooltip title="Modifier">
              <IconButton aria-label="Modifier">{I('edit')}</IconButton>
            </Tooltip>
            <Tooltip title="Ajouter">
              <IconButton color="primary" aria-label="Ajouter">
                {I('add_circle')}
              </IconButton>
            </Tooltip>
            <Tooltip title="Supprimer">
              <IconButton color="error" aria-label="Supprimer">
                {I('delete')}
              </IconButton>
            </Tooltip>
            <Tooltip title="Options">
              <IconButton className="action-icon-btn" aria-label="Options">
                {I('more_vert')}
              </IconButton>
            </Tooltip>
          </div>
        </Demo>
        <Demo label="refresh-btn / view-toggle-btn">
          <div className="row">
            {[
              ['refresh', 'Rafraîchir'],
              ['tune', 'Filtres'],
              ['file_download', 'Exporter'],
            ].map(([icon, label]) => (
              <Tooltip key={icon} title={label}>
                <IconButton className="refresh-btn" aria-label={label}>
                  {I(icon ?? '')}
                </IconButton>
              </Tooltip>
            ))}
          </div>
        </Demo>
        <Demo label="Toolbar (shell)">
          <div className="row toolbar-like">
            <IconButton aria-label="Menu">{I('menu')}</IconButton>
            <span className="spacer" />
            <IconButton aria-label="Thème">{I('dark_mode')}</IconButton>
            <IconButton aria-label="Tâches">
              <Badge badgeContent={7} color="primary">
                {I('checklist')}
              </Badge>
            </IconButton>
            <IconButton aria-label="Notifications">
              <Badge badgeContent={3} color="error">
                {I('notifications')}
              </Badge>
            </IconButton>
            <IconButton className="avatar-btn" aria-label="Compte">
              <div className="avatar">JK</div>
            </IconButton>
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="header"
        title="Actions de page"
        source=".page-actions · .create-btn · app-view-mode-toggle"
        description="Groupe d'actions en haut à droite des pages liste : bascule cartes/liste, rafraîchir, créer, suppression groupée."
      >
        <Demo label="En-tête de liste" code={code.header}>
          <div className="page-actions">
            <ViewModeToggle mode={viewMode} onChange={setViewMode} />
            <Tooltip title="Rafraîchir">
              <IconButton className="refresh-btn" aria-label="Rafraîchir">
                {I('refresh')}
              </IconButton>
            </Tooltip>
            <Button variant="contained" disableElevation={false} className="create-btn" startIcon={I('add')}>
              Nouveau produit
            </Button>
            <Button variant="outlined" color="error" startIcon={I('delete')}>
              (3)
            </Button>
          </div>
        </Demo>
        <Demo label="En-tête de fiche (détail)">
          <div className="row">
            <IconButton aria-label="Retour">{I('arrow_back')}</IconButton>
            <span className="spacer" />
            <Button variant="outlined" color="inherit" startIcon={I('edit')}>
              Modifier
            </Button>
            <Button variant="outlined" color="error" startIcon={I('delete')}>
              Supprimer
            </Button>
            <Button variant="contained" startIcon={I('send')}>
              Envoyer
            </Button>
          </div>
        </Demo>
      </DocSection>

      <DocSection
        id="segmented"
        title="Segmentés & toggles"
        source=".m3-filter-toggle · .chart-tab-toggles · mat-button-toggle-group"
        cols={3}
      >
        <Demo label="m3-filter-toggle" code={code.segmented}>
          <div className="m3-filter-toggle">
            {[
              ['month', 'Mois'],
              ['quarter', 'Trimestre'],
              ['year', 'Année'],
            ].map(([v, l]) => (
              <button
                key={v}
                type="button"
                className={period === v ? 'active' : undefined}
                onClick={() => setPeriod(v ?? '')}
              >
                {l}
              </button>
            ))}
          </div>
        </Demo>
        <Demo label="chart-tab-toggles">
          <div className="chart-tab-toggles">
            {[
              ['mois', 'Mois'],
              ['trim', 'Trimestre'],
              ['annee', 'Année'],
            ].map(([v, l]) => (
              <button
                key={v}
                type="button"
                className={`tab-toggle-btn${tab === v ? ' active' : ''}`}
                onClick={() => setTab(v ?? '')}
              >
                {l}
              </button>
            ))}
          </div>
        </Demo>
        <Demo label="app-view-mode-toggle">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
          <span className="caption">mode = {viewMode}</span>
        </Demo>
        <Demo label="Chips de filtre" hint=".filter-chip">
          <div className="filter-chips-row demo-chips">
            <button type="button" className="filter-chip active">
              Tous <span className="chip-count">48</span>
            </button>
            <button type="button" className="filter-chip success">
              Actifs <span className="chip-count">31</span>
            </button>
            <button type="button" className="filter-chip warning">
              Planifiés <span className="chip-count">6</span>
            </button>
            <button type="button" className="filter-chip danger">
              Désinstallés <span className="chip-count">4</span>
            </button>
          </div>
        </Demo>
        <Demo label="mat-button-toggle-group">
          <ToggleButtonGroup
            exclusive
            value={toggle}
            onChange={(_, v: string | null) => v && setToggle(v)}
            size="small"
          >
            <ToggleButton value="day">Jour</ToggleButton>
            <ToggleButton value="week">Semaine</ToggleButton>
            <ToggleButton value="month">Mois</ToggleButton>
          </ToggleButtonGroup>
        </Demo>
        <Demo label="Lien d'action (.line-action)">
          <span className="line-action">Voir l'historique</span>
        </Demo>
      </DocSection>

      <DocSection id="menu" title="Menu & split" source="mat-menu · .menu-danger" cols={2}>
        <Demo label="Bouton menu" code={code.menu}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={(e) => setExportMenu(e.currentTarget)}
            startIcon={I('file_download')}
            endIcon={I('expand_more')}
          >
            Exporter
          </Button>
          <Menu
            anchorEl={exportMenu}
            open={!!exportMenu}
            onClose={() => setExportMenu(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={() => setExportMenu(null)}>
              <ListItemIcon>{I('table_view')}</ListItemIcon>Excel
            </MenuItem>
            <MenuItem onClick={() => setExportMenu(null)}>
              <ListItemIcon>{I('picture_as_pdf')}</ListItemIcon>PDF
            </MenuItem>
            <Divider />
            <MenuItem className="menu-danger" onClick={() => setExportMenu(null)}>
              <ListItemIcon>{I('delete')}</ListItemIcon>Supprimer
            </MenuItem>
          </Menu>
        </Demo>
        <Demo label="Split button">
          <div className="split">
            <Button variant="contained" className="split-main" startIcon={I('send')}>
              Envoyer
            </Button>
            <Button
              variant="contained"
              className="split-toggle"
              aria-label="Plus d'options d'envoi"
              onClick={(e) => setSplitMenu(e.currentTarget)}
            >
              {I('arrow_drop_down')}
            </Button>
          </div>
          <Menu
            anchorEl={splitMenu}
            open={!!splitMenu}
            onClose={() => setSplitMenu(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={() => setSplitMenu(null)}>
              <ListItemIcon>{I('schedule_send')}</ListItemIcon>Programmer l'envoi
            </MenuItem>
            <MenuItem onClick={() => setSplitMenu(null)}>
              <ListItemIcon>{I('drafts')}</ListItemIcon>Enregistrer en brouillon
            </MenuItem>
          </Menu>
        </Demo>
      </DocSection>

      <DocSection
        id="fab"
        title="FAB"
        source="mat-fab · mat-mini-fab"
        description="Non utilisés dans les écrans d'origine ; fournis pour compléter le kit avec le thème M3 du projet."
        cols={2}
      >
        <Demo label="FAB">
          <div className="row lg">
            <Fab aria-label="Ajouter">{I('add')}</Fab>
            <Fab size="small" aria-label="Modifier">
              {I('edit')}
            </Fab>
            <Fab variant="extended">{I('add')} Nouvelle mission</Fab>
          </div>
        </Demo>
        <Demo label="Bouton d'action principale (shell)" hint=".action-main-btn">
          <Button variant="outlined" className="action-main-btn" startIcon={I('bolt')}>
            Action rapide
          </Button>
        </Demo>
      </DocSection>

      <DocSection
        id="sizes"
        title="Tailles & formes"
        description="Hauteurs : standard 40px, create-btn 42px, compact 32px ; rayons : pilule (radius-button), 10px (create-btn), arrondi complet (mat-button-rounded)."
        cols={2}
      >
        <Demo label="Hauteurs">
          <div className="row">
            <Button variant="contained" className="btn-compact">
              Compact
            </Button>
            <Button variant="contained">Standard</Button>
            <Button variant="contained" disableElevation={false} className="create-btn">
              create-btn
            </Button>
            <Button variant="contained" className="btn-large">
              Large
            </Button>
          </div>
        </Demo>
        <Demo label="Formes">
          <div className="row">
            <Button variant="contained">Pilule (M3)</Button>
            <Button variant="contained" disableElevation={false} className="create-btn">
              Rayon 10px
            </Button>
            <Button variant="outlined" className="mat-button-rounded">
              mat-button-rounded
            </Button>
          </div>
        </Demo>
      </DocSection>
    </DocPage>
  );
}
