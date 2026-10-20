import { Button, Checkbox, FormControlLabel } from '@mui/material';
import { useRef, useState, type MouseEvent } from 'react';
import { ArticleBody } from '../../../../components/content/ArticleBody';
import { articleToc } from '../../../../components/content/contentModels';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import { DOCS_NAV, DOC_PAGE } from '../../../../data/static/content.data';
import '../../ex-page.scss';
import './docs.scss';

const TOC = articleToc(DOC_PAGE);
const REASONS = ['Information manquante', 'Exemple de code incorrect', 'Difficile à comprendre', 'Faute ou coquille'];

/**
 * /examples/app/docs — documentation en trois colonnes : arborescence recherchable (collante),
 * page en carte (typographie « md »), sommaire de page ; avis « Cette page vous a aidé ? », pages précédente / suivante.
 * Mise en page alignée sur les autres écrans : marges du shell, en-tête de page, cartes à bordure fine, sans ombre.
 */
export function DocsPage() {
  const host = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState('');
  const [current, setCurrent] = useState('commentaires');
  const [closed, setClosed] = useState(new Set<string>(['Guides']));
  const [navOpen, setNavOpen] = useState(false);
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [sent, setSent] = useState(false);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState('');

  const query = q.trim().toLowerCase();
  const nav = DOCS_NAV.map((g) => ({
    ...g,
    children: (g.children ?? []).filter((c) => !query || c.label.toLowerCase().includes(query)),
  })).filter((g) => g.children.length);
  const currentLabel = DOCS_NAV.flatMap((g) => g.children ?? []).find((c) => c.slug === current)?.label ?? '';

  const toggle = (label: string) =>
    setClosed((s) => {
      const n = new Set(s);
      if (n.has(label)) n.delete(label);
      else n.add(label);
      return n;
    });
  const open = (slug: string, e: MouseEvent) => {
    e.preventDefault();
    setCurrent(slug);
    setNavOpen(false);
    setVote(null);
    setSent(false);
    host.current?.closest('.content')?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const scrollTo = (id: string, e: MouseEvent) => {
    e.preventDefault();
    host.current?.querySelector('#' + CSS.escape(id))?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="ex-page ex-docs" ref={host}>
      <div className="page-head">
        <div className="titles">
          <span className="eyebrow">Ressources</span>
          <h1>Documentation</h1>
          <p>Guides, fondations et référence des composants du kit.</p>
        </div>
        <div className="actions">
          <Button
            variant="outlined"
            color="inherit"
            className="nav-btn"
            onClick={() => setNavOpen(true)}
            startIcon={<MaterialIcon name="menu_book" />}
          >
            Sommaire
          </Button>
          <Button variant="outlined" color="inherit" startIcon={<MaterialIcon name="edit" />}>
            Modifier cette page
          </Button>
        </div>
      </div>

      <div className="docs">
        <aside className={`tree${navOpen ? ' open' : ''}`} aria-label="Arborescence de la documentation">
          <label className="searchbox">
            <MaterialIcon name="search" />
            <input type="search" placeholder="Filtrer" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <nav>
            {nav.map((g) => (
              <div key={g.label} className="group">
                <button
                  type="button"
                  className="g-head"
                  onClick={() => toggle(g.label)}
                  aria-expanded={!closed.has(g.label)}
                >
                  <MaterialIcon name={g.icon ?? 'folder'} />
                  <span>{g.label}</span>
                  <MaterialIcon name="expand_more" className={`chev${closed.has(g.label) ? ' shut' : ''}`} />
                </button>
                {(!closed.has(g.label) || q) &&
                  g.children.map((p) => (
                    <a
                      key={p.slug}
                      href="#"
                      className={`leaf${p.slug === current ? ' on' : ''}`}
                      onClick={(e) => open(p.slug ?? '', e)}
                    >
                      {p.label}
                      {p.badge && <span className="badge">{p.badge}</span>}
                    </a>
                  ))}
              </div>
            ))}
          </nav>
        </aside>
        <div className={`scrim${navOpen ? ' open' : ''}`} onClick={() => setNavOpen(false)} />

        <article className="card doc">
          <nav className="crumbs" aria-label="Fil d’Ariane">
            <span>Composants</span>
            <MaterialIcon name="chevron_right" />
            <span className="cur">{currentLabel}</span>
          </nav>
          <h2 className="doc-title">{currentLabel}</h2>
          <div className="meta">
            <span className="m3-badge info">Stable</span>
            <code>shared/components/content</code>
            <span>Mis à jour le 17 octobre 2026</span>
          </div>
          <ArticleBody blocks={DOC_PAGE} size="md" />

          <section className="feedback">
            {vote === null ? (
              <>
                <strong>Cette page vous a-t-elle aidé ?</strong>
                <div className="votes">
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => setVote('up')}
                    startIcon={<MaterialIcon name="thumb_up" />}
                  >
                    Oui
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => setVote('down')}
                    startIcon={<MaterialIcon name="thumb_down" />}
                  >
                    Non
                  </Button>
                </div>
              </>
            ) : vote === 'down' ? (
              sent ? (
                <p className="thanks">
                  <MaterialIcon name="check_circle" />
                  Merci, l’équipe documentation va revoir cette page.
                </p>
              ) : (
                <form
                  className="why"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSent(true);
                  }}
                >
                  <strong>Que pouvons-nous améliorer ?</strong>
                  <div className="reasons">
                    {REASONS.map((r) => (
                      <FormControlLabel
                        key={r}
                        control={
                          <Checkbox
                            checked={!!picked[r]}
                            onChange={(e) => setPicked((p) => ({ ...p, [r]: e.target.checked }))}
                            name={r}
                          />
                        }
                        label={r}
                      />
                    ))}
                  </div>
                  <div className="form-field">
                    <div className="field-box textarea-box">
                      <textarea
                        name="msg"
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Précisez (facultatif)"
                      />
                    </div>
                  </div>
                  <div className="row">
                    <Button type="button" onClick={() => setVote(null)}>
                      Annuler
                    </Button>
                    <Button variant="contained" disableElevation type="submit">
                      Envoyer
                    </Button>
                  </div>
                </form>
              )
            ) : (
              <p className="thanks">
                <MaterialIcon name="favorite" />
                Merci pour votre retour !
              </p>
            )}
          </section>

          <nav className="pager" aria-label="Pages voisines">
            <a href="#" onClick={(e) => open('formulaires', e)}>
              <small>Précédent</small>
              <strong>
                <MaterialIcon name="arrow_back" />
                Formulaires
              </strong>
            </a>
            <a href="#" className="next" onClick={(e) => open('article', e)}>
              <small>Suivant</small>
              <strong>
                Article
                <MaterialIcon name="arrow_forward" />
              </strong>
            </a>
          </nav>
        </article>

        <aside className="otp" aria-label="Sur cette page">
          <span className="text-overline">Sur cette page</span>
          {TOC.map((t) => (
            <a key={t.id} href="#" className={t.level === 3 ? 'sub' : ''} onClick={(e) => scrollTo(t.id, e)}>
              {t.text}
            </a>
          ))}
          <hr />
          <a href="#" onClick={(e) => e.preventDefault()}>
            <MaterialIcon name="bug_report" />
            Signaler un problème
          </a>
        </aside>
      </div>
    </div>
  );
}
