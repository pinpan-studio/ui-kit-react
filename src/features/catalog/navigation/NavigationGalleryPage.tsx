import {
  Badge,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tab,
  TablePagination,
  Tabs,
  Toolbar,
  Tooltip,
} from '@mui/material';
import { useState, type MouseEvent, type ReactNode } from 'react';
import { KitStepper } from '../../../components/navigation/KitStepper';
import { Paginator } from '../../../components/navigation/Paginator';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { Demo, DocPage, DocSection, type TocItem } from '../doc/Doc';
import { CODE } from './navCode';
import { DEMO_MENU, SIDECAR_SECTIONS, type SidecarSection } from './navData';
import './navigation-gallery.scss';

const TOC: TocItem[] = [
  { id: 'header', label: 'Header' },
  { id: 'sidebar', label: 'Sidebar' },
  { id: 'navbar', label: 'Navbar / en-tête de page' },
  { id: 'tabs', label: 'Tabs' },
  { id: 'breadcrumb', label: 'Breadcrumb' },
  { id: 'pagination', label: 'Pagination' },
  { id: 'stepper', label: 'Stepper' },
  { id: 'menu', label: 'Menu' },
];

const RAIL = DEMO_MENU.slice(0, 10);
const PILLS = [
  { k: 'infos', l: 'Informations' },
  { k: 'contrats', l: 'Contrats' },
  { k: 'factures', l: 'Factures' },
  { k: 'historique', l: 'Historique' },
];

const Ico = ({ name, badge, color }: { name: string; badge?: number; color?: 'primary' | 'error' }) =>
  badge ? (
    <Badge badgeContent={badge} color={color} className="mat-badge">
      <MaterialIcon name={name} />
    </Badge>
  ) : (
    <MaterialIcon name={name} />
  );

const TipBtn = ({ title, children, className }: { title?: string; children: ReactNode; className?: string }) => {
  const b = (
    <IconButton className={className} aria-label={title}>
      {children}
    </IconButton>
  );
  return title ? <Tooltip title={title}>{b}</Tooltip> : b;
};

/** Menu déroulant à déclencheur (mat-menu). */
function useMenu() {
  const [el, setEl] = useState<HTMLElement | null>(null);
  return { el, open: (e: MouseEvent<HTMLElement>) => setEl(e.currentTarget), close: () => setEl(null) };
}

/** Galerie /components/navigation — header, sidebars, navbar, onglets, breadcrumb, pagination, stepper, menus. */
export function NavigationGalleryPage() {
  // Sidecar
  const [sidecarOpen, setSidecarOpen] = useState<string | null>(null);
  const [sidecarItem, setSidecarItem] = useState<string | null>(null);
  const module = RAIL.find((m) => m._id === sidecarOpen) ?? null;
  const sectionsFor = (id: string): SidecarSection[] => {
    const m = RAIL.find((x) => x._id === id);
    if (!m) return [];
    return SIDECAR_SECTIONS[m._id] ?? [{ title: m.libelle, icon: m.icon, items: m.children.length ? m.children : [m] }];
  };
  const toggleSidecar = (id: string) => {
    if (sidecarOpen === id) return setSidecarOpen(null);
    setSidecarOpen(id);
    setSidecarItem(sectionsFor(id)[0]?.items[0]?._id ?? null);
  };

  // Tabs
  const [tabIndex, setTabIndex] = useState(0);
  const [stretch, setStretch] = useState(0);
  const [pillTab, setPillTab] = useState('infos');

  // Pagination
  const [page, setPage] = useState(3);
  const [pageSize, setPageSize] = useState(25);
  const [smallPage, setSmallPage] = useState(1);
  const [matPage, setMatPage] = useState(0);
  const [matSize, setMatSize] = useState(25);

  // Stepper
  const [active, setActive] = useState(0);
  const [client, setClient] = useState('Bolloré Logistics CI');
  const [periode, setPeriode] = useState('');
  const [periodeTouched, setPeriodeTouched] = useState(false);
  const [vActive, setVActive] = useState(0);

  // Menus
  const row = useMenu();
  const main = useMenu();
  const status = useMenu();
  const assign = useMenu();
  const count = useMenu();
  const closeAll = () => {
    status.close();
    assign.close();
    main.close();
  };

  return (
    <DocPage
      title="Navigation"
      icon="explore"
      className="gallery-navigation"
      subtitle="Éléments de navigation du shell (sidecar rail + sous-navigation, barre d'outils, drawer droit), en-têtes de page, onglets, fil d'Ariane, pagination, stepper et menus."
      toc={TOC}
    >
      <DocSection
        id="header"
        title="Header (toolbar du shell)"
        source="layouts/app-shell · .shell-toolbar"
        description="Barre supérieure sticky de 68px : bascule du menu, titre de page dérivé de la route, actions globales (thème, tâches du jour, notifications, paramètres, compte)."
      >
        <Demo label="Desktop" flush code={CODE.header}>
          <Toolbar className="shell-toolbar demo-toolbar mat-toolbar">
            <TipBtn>
              <MaterialIcon name="menu_open" />
            </TipBtn>
            <span className="page-title">Clients</span>
            <span className="spacer" />
            <TipBtn title="Changer de thème">
              <MaterialIcon name="dark_mode" />
            </TipBtn>
            <TipBtn title="Mes tâches du jour">
              <Ico name="checklist" badge={7} color="primary" />
            </TipBtn>
            <TipBtn title="Notifications">
              <Ico name="notifications" badge={3} color="error" />
            </TipBtn>
            <TipBtn title="Paramètres">
              <MaterialIcon name="settings" />
            </TipBtn>
            <TipBtn className="avatar-btn">
              <div className="avatar">JK</div>
            </TipBtn>
          </Toolbar>
        </Demo>
        <div className="grid-2">
          <Demo label="Déconnecté" flush>
            <Toolbar className="shell-toolbar demo-toolbar mat-toolbar">
              <TipBtn>
                <MaterialIcon name="menu" />
              </TipBtn>
              <span className="page-title">Referentiel unique</span>
              <span className="spacer" />
              <TipBtn>
                <MaterialIcon name="dark_mode" />
              </TipBtn>
              <Button variant="contained" className="signin-btn mat-raised" startIcon={<MaterialIcon name="login" />}>
                <span>Connexion</span>
              </Button>
            </Toolbar>
          </Demo>
          <Demo label="Mobile (titre masqué)" flush>
            <Toolbar className="shell-toolbar demo-toolbar mat-toolbar mobile">
              <TipBtn>
                <MaterialIcon name="menu" />
              </TipBtn>
              <span className="spacer" />
              <TipBtn>
                <Ico name="notifications" badge={3} color="error" />
              </TipBtn>
              <TipBtn className="avatar-btn">
                <div className="avatar">JK</div>
              </TipBtn>
            </Toolbar>
          </Demo>
        </div>
      </DocSection>

      <DocSection
        id="sidebar"
        title="Sidebar"
        source="sidecar du shell (rail + sous-navigation) · drawer droit"
        cols={2}
        description="Le sidecar réunit le rail d'icônes et la sous-navigation : replié par défaut, un clic sur une icône l'active et déploie une seconde colonne avec les sous-menus du module (re-cliquer ou chevron pour replier). Le drawer droit porte le compte, les notifications et les tâches."
      >
        <Demo label="Sidecar (rail + sous-navigation)" hint="cliquez une icône" code={CODE.sidecar} muted>
          <div className={`demo-sidecar${module ? ' open' : ''}`}>
            <div className="sidecar-rail">
              <div className="sidenav-header">
                <img src="/logo.png" className="brand-logo" alt="" />
              </div>
              <div className="nav-rail">
                {RAIL.map((item) => (
                  <Tooltip key={item._id} title={item.libelle} placement="right">
                    <button
                      type="button"
                      className={`nav-rail-item${sidecarOpen === item._id ? ' active' : ''}`}
                      onClick={() => toggleSidecar(item._id)}
                      aria-expanded={sidecarOpen === item._id}
                      aria-label={item.libelle}
                    >
                      <MaterialIcon name={item.icon} />
                    </button>
                  </Tooltip>
                ))}
              </div>
              <div className="user-avatar-btn">
                <div className="avatar">JK</div>
              </div>
            </div>
            <div className="sidecar-panel" aria-hidden={!module}>
              {module && (
                <>
                  <div className="sidenav-header">
                    <div className="header-icon-box">
                      <MaterialIcon name={module.icon} />
                    </div>
                    <span className="app-title">{module.libelle}</span>
                    <Tooltip title="Masquer le menu">
                      <IconButton
                        className="close-drawer-btn"
                        aria-label="Masquer le menu"
                        onClick={() => setSidecarOpen(null)}
                      >
                        <MaterialIcon name="chevron_left" />
                      </IconButton>
                    </Tooltip>
                  </div>
                  <div className="sidenav-menu-wrapper">
                    {sectionsFor(module._id).map((section) => (
                      <div className="menu-section" key={section.title}>
                        <div className="section-header active-section">
                          <MaterialIcon name={section.icon} className="section-icon" />
                          <span className="section-title">{section.title}</span>
                        </div>
                        <div className="section-items">
                          {section.items.map((sub) => (
                            <button
                              type="button"
                              key={sub._id}
                              className={`menu-item${sidecarItem === sub._id ? ' active' : ''}`}
                              onClick={() => setSidecarItem(sub._id)}
                            >
                              <MaterialIcon name={sub.icon} className="item-icon" />
                              <span className="item-label">{sub.libelle}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </Demo>
        <Demo label="Drawer droit (compte)" muted>
          <div className="demo-right-drawer">
            <div className="sidenav-inner">
              <div className="rd-header">
                <div className="header-icon-box">
                  <MaterialIcon name="manage_accounts" />
                </div>
                <div className="header-text">
                  <span className="app-title">Paramètres du compte</span>
                  <span className="app-subtitle">Profil & sécurité</span>
                </div>
                <span className="spacer" />
                <IconButton aria-label="Fermer">
                  <MaterialIcon name="close" />
                </IconButton>
              </div>
              <div className="rd-items">
                {[
                  ['badge', 'Paramètres personnels', 'Modifiez vos données personnelles', ' active'],
                  ['lock_reset', 'Mot de passe', 'Changez votre mot de passe', ''],
                  ['logout', 'Déconnexion', 'Fermer la session en cours', ' danger'],
                ].map(([icon, label, sub, cls]) => (
                  <div className={`rd-item${cls}`} key={label}>
                    <div className="item-icon-box">
                      <MaterialIcon name={icon ?? ''} />
                    </div>
                    <div className="item-content">
                      <span className="item-label">{label}</span>
                      <span className="item-sub">{sub}</span>
                    </div>
                    <MaterialIcon name="chevron_right" className="item-arrow" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <span className="caption">Version réelle : ouvrez l&apos;application et cliquez sur l&apos;avatar.</span>
        </Demo>
      </DocSection>

      <DocSection
        id="navbar"
        title="Navbar / en-tête de page"
        source=".page-header · .page-title-area · .title-row · .page-actions"
        description="Chaque page commence par cet en-tête : bouton de bascule du menu du module, titre Outfit 22px + sous-titre, actions à droite (wrap automatique en mobile)."
      >
        <Demo label="En-tête de liste" code={CODE.pageHeader}>
          <div className="page-header demo-page-header">
            <div className="page-title-area">
              <div className="title-row">
                <TipBtn title="Afficher/masquer le menu" className="drawer-toggle-btn">
                  <MaterialIcon name="menu" />
                </TipBtn>
                <div>
                  <h1>Registre des Produits</h1>
                  <p>
                    Catalogue des offres : tarifs d&apos;installation, d&apos;abonnement et de désinstallation — 24
                    produit(s)
                  </p>
                </div>
              </div>
            </div>
            <div className="page-actions">
              <TipBtn title="Rafraîchir" className="refresh-btn">
                <MaterialIcon name="refresh" />
              </TipBtn>
              <Button variant="contained" className="create-btn mat-raised" startIcon={<MaterialIcon name="add" />}>
                Nouveau Produit
              </Button>
            </div>
          </div>
        </Demo>
        <Demo label="En-tête de fiche (retour + statut)">
          <div className="page-header demo-page-header">
            <div className="page-title-area">
              <div className="title-row">
                <TipBtn>
                  <MaterialIcon name="arrow_back" />
                </TipBtn>
                <div>
                  <div className="breadcrumb">Clients / Fiche client</div>
                  <h1>
                    Bolloré Logistics CI <span className="m3-badge success">Actif</span>
                  </h1>
                  <p>CLI-1043 · Abidjan, Plateau · client depuis mars 2024</p>
                </div>
              </div>
            </div>
            <div className="page-actions">
              <Button variant="outlined" color="inherit" startIcon={<MaterialIcon name="edit" />}>
                Modifier
              </Button>
              <Button variant="contained" startIcon={<MaterialIcon name="add" />}>
                Nouveau contrat
              </Button>
            </div>
          </div>
        </Demo>
      </DocSection>

      <DocSection id="tabs" title="Tabs" source="mat-tab-group · .chart-tab-toggles · onglets pilule" cols={2}>
        <Demo label="mat-tab-group" hint={`onglet ${tabIndex + 1}`}>
          <Tabs
            value={tabIndex}
            onChange={(_, v: number) => setTabIndex(v)}
            className="mat-tab-group"
            variant="scrollable"
            scrollButtons={false}
          >
            <Tab
              label={
                <span className="tab-lbl">
                  <MaterialIcon name="info" className="tab-icon" /> Informations
                </span>
              }
            />
            <Tab
              label={
                <span className="tab-lbl">
                  <MaterialIcon name="directions_car" className="tab-icon" /> Véhicules{' '}
                  <span className="tab-count">42</span>
                </span>
              }
            />
            <Tab
              label={
                <span className="tab-lbl">
                  <MaterialIcon name="receipt_long" className="tab-icon" /> Factures
                </span>
              }
            />
            <Tab label="Archives" disabled />
          </Tabs>
          <p className="tab-body">
            {
              [
                'Raison sociale, contacts, adresse de facturation et gestionnaire attitré.',
                'Liste des véhicules équipés et état des balises.',
                'Historique de facturation et encaissements.',
              ][tabIndex]
            }
          </p>
        </Demo>
        <Demo label="Onglets pilule (segmentés)">
          <div className="chart-tab-toggles" role="tablist">
            {PILLS.map((t) => (
              <button
                key={t.k}
                role="tab"
                aria-selected={pillTab === t.k}
                className={`tab-toggle-btn${pillTab === t.k ? ' active' : ''}`}
                onClick={() => setPillTab(t.k)}
              >
                {t.l}
              </button>
            ))}
          </div>
          <p className="tab-body">Contenu de l&apos;onglet « {pillTab} ».</p>
        </Demo>
        <Demo label="Onglets étirés (header)">
          <Tabs
            value={stretch}
            onChange={(_, v: number) => setStretch(v)}
            variant="fullWidth"
            className="mat-tab-group"
          >
            <Tab label="Aujourd'hui" />
            <Tab label="En retard" />
            <Tab label="À valider" />
          </Tabs>
        </Demo>
        <Demo label="Liens de navigation (mat-tab-nav-bar)">
          <Tabs
            component="nav"
            value={
              ['infos', 'contrats', 'factures'].indexOf(pillTab) === -1
                ? false
                : ['infos', 'contrats', 'factures'].indexOf(pillTab)
            }
            className="mat-tab-group mat-tab-nav-bar"
          >
            <Tab
              component="a"
              href="#"
              label="Vue d'ensemble"
              onClick={(e: MouseEvent) => (e.preventDefault(), setPillTab('infos'))}
            />
            <Tab
              component="a"
              href="#"
              label="Backlog"
              onClick={(e: MouseEvent) => (e.preventDefault(), setPillTab('contrats'))}
            />
            <Tab
              component="a"
              href="#"
              label="Analytics"
              onClick={(e: MouseEvent) => (e.preventDefault(), setPillTab('factures'))}
            />
          </Tabs>
        </Demo>
      </DocSection>

      <DocSection
        id="breadcrumb"
        title="Breadcrumb"
        source=".breadcrumb (clients/contrats, factures, intervention/equipe-technique)"
        cols={2}
      >
        <Demo label="Sur-titre majuscule (original)" code={CODE.breadcrumb}>
          <div className="breadcrumb">SC REGISTRY / CONTRATS</div>
          <h1 className="demo-h1">Contrat CTR-2026-0042</h1>
        </Demo>
        <Demo label="Fil d'Ariane cliquable">
          <nav className="crumbs" aria-label="Fil d'Ariane">
            <a href="#" onClick={(e) => e.preventDefault()} aria-label="Accueil">
              <MaterialIcon name="home" />
            </a>
            <MaterialIcon name="chevron_right" className="sep" />
            <a href="#" onClick={(e) => e.preventDefault()}>
              Clients
            </a>
            <MaterialIcon name="chevron_right" className="sep" />
            <a href="#" onClick={(e) => e.preventDefault()}>
              Bolloré Logistics CI
            </a>
            <MaterialIcon name="chevron_right" className="sep" />
            <span className="current">Contrat CTR-2026-0042</span>
          </nav>
        </Demo>
      </DocSection>

      <DocSection
        id="pagination"
        title="Pagination"
        source="app-paginator (shared) · mat-paginator"
        description="app-paginator est utilisé par 43 écrans : taille de page, plage, première/précédente/numéros avec ellipses/suivante/dernière."
      >
        <Demo label="Plusieurs pages" hint={`page ${page} · ${pageSize}/page`} code={CODE.paginator}>
          <Paginator
            total={1284}
            page={page}
            itemPerPage={pageSize}
            pageSizeOptions={[10, 25, 50, 100]}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
          />
        </Demo>
        <div className="grid-2">
          <Demo label="Peu de pages">
            <Paginator total={42} page={smallPage} itemPerPage={20} onPageChange={setSmallPage} />
          </Demo>
          <Demo label="Vide">
            <Paginator total={0} page={1} itemPerPage={20} />
          </Demo>
        </div>
        <Demo label="mat-paginator (Material)">
          <TablePagination
            component="div"
            className="mat-paginator"
            count={1284}
            page={matPage}
            rowsPerPage={matSize}
            rowsPerPageOptions={[10, 25, 50]}
            onPageChange={(_, p) => setMatPage(p)}
            onRowsPerPageChange={(e) => {
              setMatSize(Number(e.target.value));
              setMatPage(0);
            }}
            showFirstButton
            showLastButton
            labelRowsPerPage="Items per page:"
            labelDisplayedRows={({ from, to, count: c }) => `${from} – ${to} of ${c}`}
            aria-label="Pagination"
          />
        </Demo>
      </DocSection>

      <DocSection
        id="stepper"
        title="Stepper"
        source="mat-stepper (formulaires client, mission, rôle de facturation, paiement…)"
      >
        <Demo label="Horizontal (linéaire, validation)">
          <KitStepper
            linear
            active={active}
            onSelect={(i) => {
              if (i === 2 && !periode.trim()) return setPeriodeTouched(true);
              setActive(i);
            }}
            steps={[
              { label: 'Client', completed: !!client.trim() && active > 0 },
              { label: 'Période', completed: !!periode.trim() && active > 1 },
              { label: 'Récapitulatif' },
            ]}
          >
            {active === 0 && (
              <div className="step-body">
                <div className="form-field">
                  <label className="field-label">Client *</label>
                  <div className="field-box">
                    <MaterialIcon name="business" />
                    <input value={client} onChange={(e) => setClient(e.target.value)} aria-label="Client" />
                  </div>
                </div>
                <div className="step-actions">
                  <Button variant="contained" onClick={() => client.trim() && setActive(1)}>
                    Suivant
                  </Button>
                </div>
              </div>
            )}
            {active === 1 && (
              <div className="step-body">
                <div className="form-field">
                  <label className="field-label">Période *</label>
                  <div className="field-box">
                    <MaterialIcon name="event" />
                    <input
                      value={periode}
                      onChange={(e) => setPeriode(e.target.value)}
                      onBlur={() => setPeriodeTouched(true)}
                      placeholder="Ex : Octobre 2026"
                      aria-label="Période"
                    />
                  </div>
                  {!periode.trim() && periodeTouched && <span className="field-error">La période est requise</span>}
                </div>
                <div className="step-actions">
                  <Button onClick={() => setActive(0)}>Retour</Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setPeriodeTouched(true);
                      if (periode.trim()) setActive(2);
                    }}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
            {active === 2 && (
              <div className="step-body">
                <p>
                  Client : <strong>{client}</strong> — Période : <strong>{periode}</strong>
                </p>
                <div className="step-actions">
                  <Button onClick={() => setActive(1)}>Retour</Button>
                  <Button
                    onClick={() => {
                      setActive(0);
                      setClient('Bolloré Logistics CI');
                      setPeriode('');
                      setPeriodeTouched(false);
                    }}
                  >
                    Recommencer
                  </Button>
                  <Button variant="contained">Générer</Button>
                </div>
              </div>
            )}
          </KitStepper>
        </Demo>
        <div className="grid-2">
          <Demo label="Vertical">
            <KitStepper
              orientation="vertical"
              active={vActive}
              onSelect={setVActive}
              steps={[
                ['Informations générales', 'Nom, type, description.'],
                ['Permissions', 'Arbre des droits par module.'],
                ['Membres', 'Utilisateurs rattachés.'],
              ].map(([l, body], i) => ({
                label: l ?? '',
                completed: i === 0,
                state: 'done' as const,
                content: (
                  <>
                    <p className="tab-body">{body}</p>
                    {i < 2 && <Button onClick={() => setVActive(i + 1)}>Suivant</Button>}
                  </>
                ),
              }))}
            />
          </Demo>
          <Demo label="Indicateur d'étapes (wizard compact)">
            <div className="steps-indicator">
              {['Sélection', 'Paramètres', 'Aperçu', 'Génération'].flatMap((s, i) => [
                <div key={s} className={`step${i < 2 ? ' done' : ''}${i === 2 ? ' current' : ''}`}>
                  <span className="dot">{i < 2 ? <MaterialIcon name="check" /> : i + 1}</span>
                  <span className="lbl">{s}</span>
                </div>,
                ...(i < 3 ? [<span key={`b${i}`} className={`bar${i < 2 ? ' done' : ''}`} />] : []),
              ])}
            </div>
          </Demo>
        </div>
      </DocSection>

      <DocSection id="menu" title="Menu" source="mat-menu (panel m3-dropdown-menu) · .menu-danger" cols={3}>
        <Demo label="Actions de ligne">
          <IconButton className="action-icon-btn" aria-label="Actions" onClick={row.open}>
            <MaterialIcon name="more_vert" />
          </IconButton>
          <Menu
            anchorEl={row.el}
            open={!!row.el}
            onClose={row.close}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={row.close}>
              <ListItemIcon>
                <MaterialIcon name="visibility" />
              </ListItemIcon>
              Voir la fiche
            </MenuItem>
            <MenuItem onClick={row.close}>
              <ListItemIcon>
                <MaterialIcon name="edit" />
              </ListItemIcon>
              Modifier
            </MenuItem>
            <Divider />
            <MenuItem onClick={row.close} className="menu-danger">
              <ListItemIcon>
                <MaterialIcon name="delete" />
              </ListItemIcon>
              Supprimer
            </MenuItem>
          </Menu>
        </Demo>
        <Demo label="Sous-menu">
          <Button variant="outlined" color="inherit" startIcon={<MaterialIcon name="swap_horiz" />} onClick={main.open}>
            Changer le statut
          </Button>
          <Menu anchorEl={main.el} open={!!main.el} onClose={closeAll}>
            <MenuItem onClick={status.open} aria-haspopup="menu">
              <ListItemIcon>
                <MaterialIcon name="flag" />
              </ListItemIcon>
              Statut
              <MaterialIcon name="arrow_right" className="submenu-arrow" />
            </MenuItem>
            <MenuItem onClick={assign.open} aria-haspopup="menu">
              <ListItemIcon>
                <MaterialIcon name="person" />
              </ListItemIcon>
              Affecter à
              <MaterialIcon name="arrow_right" className="submenu-arrow" />
            </MenuItem>
          </Menu>
          {[
            [status, ['En cours', 'Résolue', 'Clôturée']] as const,
            [assign, ['Koffi N’Guessan', 'Aminata Diallo']] as const,
          ].map(([m, items], k) => (
            <Menu
              key={k}
              anchorEl={m.el}
              open={!!m.el}
              onClose={m.close}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              {items.map((it) => (
                <MenuItem key={it} onClick={closeAll}>
                  {it}
                </MenuItem>
              ))}
            </Menu>
          ))}
        </Demo>
        <Demo label="Menu avec compteurs" hint=".option-label / .option-count">
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<MaterialIcon name="filter_list" />}
            onClick={count.open}
          >
            Statut
          </Button>
          <Menu anchorEl={count.el} open={!!count.el} onClose={count.close} className="m3-dropdown-menu">
            {[
              ['Tous', 48],
              ['Actifs', 31],
              ['Suspendus', 5],
            ].map(([l, n], i) => (
              <MenuItem key={l} onClick={count.close} className={i === 0 ? 'active' : ''}>
                <span className="option-label">{l}</span>
                <span className="option-count">{n}</span>
              </MenuItem>
            ))}
          </Menu>
        </Demo>
      </DocSection>
    </DocPage>
  );
}
