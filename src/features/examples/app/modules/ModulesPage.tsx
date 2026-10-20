import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { StatCounter } from '../../../../components/data/StatCounter';
import { EmptyState } from '../../../../components/feedback/EmptyState';
import { Kbd } from '../../../../components/interaction/Kbd';
import { useInteractions } from '../../../../components/interaction/useInteractions';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import { EX_ACTIVITY, EX_MODULES } from '../../../../data/static/examples.data';
import '../../ex-page.scss';
import './modules.scss';

const ACTIVITY = EX_ACTIVITY.slice(0, 4);
const QUICK = [
  { label: 'Nouvelle facture', icon: 'receipt_long', path: '/examples/app/dashboard' },
  { label: 'Ajouter un client', icon: 'person_add', path: '/examples/app/clients' },
  { label: 'Planifier', icon: 'event', path: '/examples/app/board' },
  { label: 'Réserver une salle', icon: 'meeting_room', path: '/examples/forms/booking' },
];
const TODAY = [
  { label: 'Encaissé aujourd’hui', value: 4.25e6, format: 'compact' as const, decimals: 2, unit: 'FCFA' },
  { label: 'Interventions prévues', value: 14, format: 'number' as const, decimals: 0, unit: '' },
  { label: 'Tickets ouverts', value: 7, format: 'number' as const, decimals: 0, unit: '' },
  { label: 'Taux de service', value: 98.2, format: 'percent' as const, decimals: 1, unit: '' },
];
const RECENT = [
  { label: 'Cacao Plus', sub: 'Client · modifié il y a 10 min', icon: 'business', path: '/examples/app/clients/c-104' },
  { label: 'Clients actifs', sub: 'Liste · 12 résultats', icon: 'group', path: '/examples/app/clients' },
  { label: 'Déploiement Sotra', sub: 'Projet · 10 tâches', icon: 'view_kanban', path: '/examples/app/board' },
  { label: 'Catalogue matériel', sub: 'Catalogue · 12 articles', icon: 'inventory_2', path: '/examples/app/catalog' },
];
const LINKS: Record<string, string> = {
  crm: '/examples/app/clients',
  billing: '/examples/app/dashboard',
  stock: '/examples/app/catalog',
  planning: '/examples/app/board',
  support: '/examples/app/inbox',
  settings: '/examples/app/settings',
  docs: '/examples/app/docs',
  reports: '/examples/app/dashboard',
};

/** /examples/app/modules — navigation horizontale, accueil : recherche, raccourcis, chiffres du jour, tuiles de modules, récents, activité. */
export function ModulesPage() {
  const { openPalette } = useInteractions();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const modules = EX_MODULES.filter((m) => !q || (m.label + m.description).toLowerCase().includes(q));

  return (
    <div className="ex-page ex-modules">
      <div className="wrap">
        <section className="hero">
          <span className="eyebrow">Vendredi 17 octobre</span>
          <h1>Bonjour Jean</h1>
          <p>Que voulez-vous faire aujourd’hui ?</p>
          <label className="big-search">
            <MaterialIcon name="search" />
            <input
              type="search"
              placeholder="Filtrer les modules…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="button" className="palette" onClick={openPalette}>
              Toutes les commandes <Kbd keys="mod+k" />
            </button>
          </label>
          <div className="quick">
            {QUICK.map((x) => (
              <Link key={x.label} className="chip-filter" to={x.path}>
                <MaterialIcon name={x.icon} />
                {x.label}
              </Link>
            ))}
          </div>
        </section>

        <div className="today">
          {TODAY.map((t) => (
            <div key={t.label} className="t-item">
              <span className="t-val">
                <StatCounter value={t.value} format={t.format} decimals={t.decimals} />
                {t.unit && <small>{t.unit}</small>}
              </span>
              <span className="t-lbl">{t.label}</span>
            </div>
          ))}
        </div>

        <div className="section-title">
          <h2>Modules</h2>
          <span>{modules.length} disponibles</span>
        </div>
        <div className="tiles">
          {modules.map((m) => (
            <Link
              key={m.id}
              className="card tile"
              to={LINKS[m.id] ?? '/examples/app/modules'}
              style={{ '--c': m.color } as CSSProperties}
            >
              <span className="t-ic">
                <MaterialIcon name={m.icon} />
              </span>
              <span className="t-txt">
                <strong>
                  {m.label}
                  {m.badge && <b>{m.badge}</b>}
                </strong>
                <span>{m.description}</span>
              </span>
              {m.count && <small>{m.count}</small>}
            </Link>
          ))}
          {modules.length === 0 && (
            <div className="card none">
              <EmptyState
                icon="search_off"
                title="Aucun module"
                subtitle="Essayez un autre mot-clé ou ouvrez la palette de commandes."
              />
            </div>
          )}
        </div>

        <div className="bottom">
          <section className="card">
            <div className="card-head">
              <h2>Récemment consultés</h2>
            </div>
            <div className="rows list">
              {RECENT.map((r) => (
                <Link key={r.label} to={r.path} className="row">
                  <span className="ic-tile">
                    <MaterialIcon name={r.icon} />
                  </span>
                  <span className="grow">
                    <strong>{r.label}</strong>
                    <small>{r.sub}</small>
                  </span>
                  <MaterialIcon name="chevron_right" className="chev" />
                </Link>
              ))}
            </div>
          </section>
          <section className="card">
            <div className="card-head">
              <h2>Activité</h2>
              <Link to="/examples/app/feed">Fil d’équipe</Link>
            </div>
            <div className="rows list">
              {ACTIVITY.map((a) => (
                <div key={a.text} className="row">
                  <span className={'ic-tile tone-' + a.tone}>
                    <MaterialIcon name={a.icon} />
                  </span>
                  <span className="grow">
                    <strong className="wrap">{a.text}</strong>
                    <small>
                      {a.who} · {a.at}
                    </small>
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
