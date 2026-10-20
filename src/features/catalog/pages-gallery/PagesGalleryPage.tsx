import { Button } from '@mui/material';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { MatSelect } from '../../../components/forms/MatSelect';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { PAGE_REGISTRY, type PageEntry, type PageGroup } from '../../../data/static/pageRegistry';
import { DocPage } from '../doc/Doc';
import './pages-gallery.scss';

type Kind = NonNullable<PageEntry['kind']>;

const KIND_LABEL: Record<Kind, string> = {
  dashboard: 'Tableau de bord',
  list: 'Liste',
  detail: 'Détail',
  form: 'Formulaire',
  wizard: 'Assistant',
  calendar: 'Calendrier',
  kanban: 'Kanban',
  settings: 'Paramètres',
  auth: 'Authentification',
  public: 'Publique',
  other: 'Autre',
};
const KIND_ICON: Record<Kind, string> = {
  dashboard: 'dashboard',
  list: 'view_list',
  detail: 'article',
  form: 'edit_note',
  wizard: 'linear_scale',
  calendar: 'calendar_month',
  kanban: 'view_kanban',
  settings: 'settings',
  auth: 'lock',
  public: 'public',
  other: 'web',
};
const KINDS = Object.keys(KIND_LABEL) as Kind[];
const MODULE_OPTIONS = [
  { value: '', label: 'Tous les modules' },
  ...PAGE_REGISTRY.map((g) => ({ value: g.id, label: g.label })),
];

/** /pages — galerie de toutes les pages statiques, groupées par module (PagesGalleryComponent). */
export function PagesGalleryPage() {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  const groups = useMemo<PageGroup[]>(() => {
    const q = query.toLowerCase().trim();
    return PAGE_REGISTRY.filter((g) => !moduleFilter || g.id === moduleFilter)
      .map((g) => ({
        ...g,
        pages: g.pages.filter(
          (p) =>
            (!kind || p.kind === kind) &&
            (!q ||
              p.label.toLowerCase().includes(q) ||
              p.path.toLowerCase().includes(q) ||
              (p.description ?? '').toLowerCase().includes(q) ||
              g.label.toLowerCase().includes(q)),
        ),
      }))
      .filter((g) => g.pages.length > 0 || (!q && !kind));
  }, [query, kind, moduleFilter]);

  const count = groups.reduce((n, g) => n + g.pages.length, 0);
  const toc = groups.map((g) => ({ id: g.id, label: `${g.label} (${g.pages.length})` }));
  const reset = () => {
    setQuery('');
    setKind('');
    setModuleFilter('');
  };

  return (
    <DocPage
      title="Pages"
      icon="view_quilt"
      eyebrow="Catalogue"
      className="pages-gallery"
      subtitle="Toutes les pages de l'application d'origine, converties en version 100 % statique. Cliquez une carte pour ouvrir la page dans son shell ; les puces ouvrent ses variantes d'état (vide, chargement, erreur…)."
      toc={toc}
    >
      <div className="filters">
        <div className="search">
          <MaterialIcon name="search" />
          <input
            type="text"
            placeholder="Rechercher une page, une URL…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Effacer">
              <MaterialIcon name="close" />
            </button>
          )}
        </div>
        <div className="field-box select-box small">
          <MaterialIcon name="apps" />
          <MatSelect
            options={MODULE_OPTIONS}
            value={moduleFilter}
            onChange={(v) => setModuleFilter(v as string)}
            placeholder="Tous les modules"
            aria-label="Module"
          />
        </div>
        <div className="kind-chips">
          <button type="button" className={!kind ? 'active' : ''} onClick={() => setKind('')}>
            Tous types
          </button>
          {KINDS.map((k) => (
            <button key={k} type="button" className={kind === k ? 'active' : ''} onClick={() => setKind(k)}>
              <MaterialIcon name={KIND_ICON[k]} />
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <span className="count">{count} page(s)</span>
      </div>

      {groups.map((g) => (
        <section key={g.id} className="group" id={g.id}>
          <div className="group-head">
            <div className="g-icon">
              <MaterialIcon name={g.icon} />
            </div>
            <div className="g-text">
              <h2>{g.label}</h2>
              {g.description && <p>{g.description}</p>}
            </div>
            <span className="g-count">{g.pages.length}</span>
          </div>
          {g.pages.length ? (
            <div className="page-grid">
              {g.pages.map((p) => (
                <div key={p.path} className="page-card">
                  <Link className="pc-main" to={p.path}>
                    <div className="pc-top">
                      <span className="pc-icon">
                        <MaterialIcon name={p.icon || (p.kind ? KIND_ICON[p.kind] : 'web')} />
                      </span>
                      {p.kind && <span className="pc-kind">{KIND_LABEL[p.kind]}</span>}
                    </div>
                    <strong>{p.label}</strong>
                    {p.description && <span className="pc-desc">{p.description}</span>}
                    <code>{p.path}</code>
                  </Link>
                  {!!p.variants?.length && (
                    <div className="pc-variants">
                      {p.variants.map((v) => (
                        <Link key={v.path} to={v.path} className="variant">
                          {v.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="g-empty">
              <MaterialIcon name="construction" /> Conversion de ce module en cours.
            </div>
          )}
        </section>
      ))}
      {groups.length === 0 && (
        <div className="g-empty big">
          <MaterialIcon name="search_off" /> Aucune page ne correspond.{' '}
          <Button color="primary" onClick={reset}>
            Réinitialiser
          </Button>
        </div>
      )}
    </DocPage>
  );
}
