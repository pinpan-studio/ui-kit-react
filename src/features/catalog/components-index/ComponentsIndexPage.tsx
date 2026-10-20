import { Link } from 'react-router';
import { COMPONENT_CATEGORIES } from '../../../components/layout/nav';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { DocPage } from '../doc/Doc';
import './components-index.scss';

/** /components : index des catégories (ComponentsIndexComponent). */
export function ComponentsIndexPage() {
  return (
    <DocPage
      title="Composants"
      icon="widgets"
      eyebrow="Catalogue"
      subtitle="Tous les composants visuels du projet, regroupés par catégorie, avec leurs variantes d'état et des extraits de code à réutiliser."
    >
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
            <MaterialIcon name="arrow_forward" className="arrow" />
          </Link>
        ))}
      </div>
    </DocPage>
  );
}
