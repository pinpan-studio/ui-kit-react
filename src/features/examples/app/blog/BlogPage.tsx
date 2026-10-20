import { Button } from '@mui/material';
import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import { ARTICLES, BLOG_CATEGORIES } from '../../../../data/static/content.data';
import { initials } from '../../exUtils';
import '../../ex-page.scss';
import './blog.scss';

const FEATURED = ARTICLES.find((a) => a.featured);
const POPULAR = ARTICLES.slice(0, 4);
const TAGS = [...new Set(ARTICLES.flatMap((a) => a.tags))];
const longDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

/** /examples/app/blog — magazine : article à la une, catégories, grille de cartes, colonne (newsletter, populaires, tags). */
export function BlogPage() {
  const [cat, setCat] = useState('Tous');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const list = ARTICLES.filter((a) => !a.featured && (cat === 'Tous' || a.category === cat));
  const f = FEATURED;

  return (
    <div className="ex-page ex-blog">
      <header className="masthead">
        <span className="text-overline">Le journal du produit</span>
        <h1>Carnets de conception</h1>
        <p>Design, produit et ingénierie : ce que nous apprenons en construisant le kit.</p>
      </header>

      {f && (
        <Link className="card feature" to={`/examples/app/blog/${f.slug}`}>
          <div className="f-art" style={{ '--h': f.hue } as CSSProperties}>
            <MaterialIcon name={f.icon} />
          </div>
          <div className="f-body">
            <span className="cat">{f.category} · À la une</span>
            <h2>{f.title}</h2>
            <p>{f.dek}</p>
            <div className="byline">
              <span className="ava" style={{ background: f.author.color }}>
                {initials(f.author.name)}
              </span>
              <span>
                <strong>{f.author.name}</strong>
                <small>
                  {longDate(f.date)} · {f.minutes} min de lecture
                </small>
              </span>
            </div>
          </div>
        </Link>
      )}

      <div className="layout">
        <div>
          <nav className="cats" aria-label="Catégories">
            {BLOG_CATEGORIES.map((c) => (
              <button key={c} className={`chip-filter${cat === c ? ' on' : ''}`} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </nav>
          <div className="grid">
            {list.map((a) => (
              <Link key={a.slug} className="post" to={`/examples/app/blog/${a.slug}`}>
                <div className="p-art" style={{ '--h': a.hue } as CSSProperties}>
                  <MaterialIcon name={a.icon} />
                </div>
                <span className="cat">{a.category}</span>
                <h3>{a.title}</h3>
                <p className="text-clamp-2">{a.dek}</p>
                <small className="meta">
                  {a.author.name} · {shortDate(a.date)} · {a.minutes} min
                </small>
              </Link>
            ))}
          </div>
        </div>

        <aside className="side">
          <section className="card newsletter">
            <MaterialIcon name="mark_email_unread" />
            <h3>La lettre du jeudi</h3>
            <p>Un article, trois liens, zéro spam. Chaque jeudi matin.</p>
            {subscribed ? (
              <p className="ok">
                <MaterialIcon name="check_circle" />
                Inscription confirmée pour {email}.
              </p>
            ) : (
              <form
                className="nl-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.includes('@')) setSubscribed(true);
                }}
              >
                <div className="form-field">
                  <div className="field-box">
                    <MaterialIcon name="mail" />
                    <input
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.ci"
                      required
                    />
                  </div>
                </div>
                <Button variant="contained" disableElevation type="submit" disabled={!email.includes('@')}>
                  S’abonner
                </Button>
              </form>
            )}
          </section>
          <section className="card popular">
            <h3>Les plus lus</h3>
            <ol>
              {POPULAR.map((a, i) => (
                <li key={a.slug}>
                  <span className="rank">{i + 1}</span>
                  <Link to={`/examples/app/blog/${a.slug}`}>{a.title}</Link>
                </li>
              ))}
            </ol>
          </section>
          <section className="card tags">
            <h3>Sujets</h3>
            <div>
              {TAGS.map((t) => (
                <span key={t}>#{t}</span>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
