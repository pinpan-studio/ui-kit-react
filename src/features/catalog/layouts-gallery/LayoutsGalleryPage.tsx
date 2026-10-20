import { Button } from '@mui/material';
import { Link } from 'react-router';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { DocPage } from '../doc/Doc';
import './layouts-gallery.scss';

interface LayoutCard {
  id: string;
  title: string;
  icon: string;
  file: string;
  description: string;
  wire: 'shell' | 'module' | 'auth' | 'kit' | 'public' | 'drawer' | 'dialog' | 'detail';
  links: { label: string; path: string }[];
}

const LAYOUTS: LayoutCard[] = [
  {
    id: 'shell',
    title: 'Shell applicatif',
    icon: 'space_dashboard',
    wire: 'shell',
    file: 'layouts/app-shell/app-shell.component.*',
    description:
      'Rail d’icônes (modules) + barre d’outils sticky (titre, thème, tâches, notifications, compte) + contenu routé + drawer droit. En mobile, le rail passe en mode « over ».',
    links: [{ label: 'Ouvrir le shell', path: '/main' }],
  },
  {
    id: 'detail',
    title: 'Fiche détail',
    icon: 'article',
    wire: 'detail',
    file: 'styles/_detail-page.scss',
    description:
      'En-tête (retour, titre, statut, actions), grille KPI, colonnes principale + latérale de panneaux, onglets de sous-listes.',
    links: [],
  },
  {
    id: 'drawer',
    title: 'Drawer droit',
    icon: 'right_panel_open',
    wire: 'drawer',
    file: 'layouts/app-shell/panels/*',
    description:
      'Panneau flottant 360px : paramètres du compte, notifications, tâches du jour. Ouvert depuis la barre d’outils du shell.',
    links: [
      { label: 'Ouvrir l’application', path: '/main' },
      { label: 'Démo drawer', path: '/components/feedback' },
    ],
  },
  {
    id: 'dialog',
    title: 'Dialogs',
    icon: 'open_in_new',
    wire: 'dialog',
    file: 'shared/components/{crud-dialog,confirm-dialog,dialogs}',
    description:
      'Modales de formulaire (CrudDialog, panelClass assac-dialog-panel), confirmations, messages poussés, dialogs de compte.',
    links: [
      { label: 'Galerie Feedback', path: '/components/feedback' },
      { label: 'Formulaire en modale', path: '/components/forms' },
    ],
  },
  {
    id: 'kit',
    title: 'Catalogue (UI Kit)',
    icon: 'widgets',
    wire: 'kit',
    file: 'layouts/kit-layout/kit-layout.component.*',
    description:
      'Layout de ce catalogue : sidebar arborescente recherchable (Showcase, Components, Layouts, Pages), barre supérieure, contenu documentaire.',
    links: [
      { label: 'UI Showcase', path: '/ui-showcase' },
      { label: 'Pages', path: '/pages' },
    ],
  },
];

/** Maquette schématique d'un layout (blocs CSS). */
function Wire({ wire }: { wire: LayoutCard['wire'] }) {
  switch (wire) {
    case 'shell':
      return (
        <>
          <div className="rail" />
          <div className="main">
            <div className="bar" />
            <div className="content">
              <span />
              <span />
              <span className="wide" />
            </div>
          </div>
        </>
      );
    case 'module':
      return (
        <>
          <div className="rail" />
          <div className="main">
            <div className="bar" />
            <div className="split">
              <div className="subnav">
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="content">
                <span className="wide" />
                <span />
                <span />
              </div>
            </div>
          </div>
        </>
      );
    case 'detail':
      return (
        <div className="main full">
          <div className="head" />
          <div className="kpis">
            <b />
            <b />
            <b />
            <b />
          </div>
          <div className="cols">
            <div className="big" />
            <div className="aside" />
          </div>
        </div>
      );
    case 'auth':
      return (
        <>
          <div className="visual" />
          <div className="form">
            <i />
            <i />
            <i />
            <b />
          </div>
        </>
      );
    case 'public':
      return (
        <div className="doc">
          <div className="head" />
          <i />
          <i />
          <i className="short" />
          <div className="table" />
        </div>
      );
    case 'drawer':
      return (
        <>
          <div className="rail" />
          <div className="main">
            <div className="bar" />
            <div className="content dim" />
          </div>
          <div className="drawer">
            <i />
            <i />
            <i />
          </div>
        </>
      );
    case 'dialog':
      return (
        <>
          <div className="main full dim" />
          <div className="dialog">
            <i />
            <i />
            <b />
          </div>
        </>
      );
    case 'kit':
      return (
        <>
          <div className="tree">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="main">
            <div className="bar" />
            <div className="content">
              <span className="wide" />
              <span />
              <span />
            </div>
          </div>
        </>
      );
  }
}

/** /layouts — layouts complets du projet, avec maquette schématique et liens vers les exemples vivants. */
export function LayoutsGalleryPage() {
  return (
    <DocPage
      title="Layouts"
      icon="dashboard_customize"
      eyebrow="Catalogue"
      className="layouts-gallery"
      subtitle="Les gabarits d'écran complets du projet. Chaque carte montre la structure schématique et ouvre des exemples réels. Les briques de mise en page (grilles, panneaux, conteneurs) sont dans Composants › Layout."
    >
      <div className="layout-grid">
        {LAYOUTS.map((l) => (
          <article key={l.id} className="layout-card" id={l.id}>
            <div className={`preview wire-${l.wire}`}>
              <Wire wire={l.wire} />
            </div>
            <div className="body">
              <div className="title">
                <MaterialIcon name={l.icon} />
                <h2>{l.title}</h2>
              </div>
              <p>{l.description}</p>
              <code>{l.file}</code>
              <div className="links">
                {l.links.map((k) => (
                  <Button
                    key={k.path}
                    variant="outlined"
                    component={Link}
                    to={k.path}
                    endIcon={<MaterialIcon name="arrow_forward" />}
                  >
                    {k.label}
                  </Button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </DocPage>
  );
}
