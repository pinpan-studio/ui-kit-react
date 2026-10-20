import { Button, Tooltip } from '@mui/material';
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { Link, useParams } from 'react-router';
import { ArticleBody } from '../../../../components/content/ArticleBody';
import { CommentThread } from '../../../../components/content/CommentThread';
import { articleToc, type Article } from '../../../../components/content/contentModels';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import { ARTICLES, COMMENTS, ME, PEOPLE } from '../../../../data/static/content.data';
import { initials } from '../../exUtils';
import '../../ex-page.scss';
import './article.scss';

/**
 * /examples/app/blog/:slug — page article : progression de lecture, sommaire suivi,
 * réglages de lecture (taille, police), partage, auteur, articles liés et commentaires.
 */
export function ArticlePage() {
  const { slug } = useParams();
  const host = useRef<HTMLDivElement>(null);
  const a: Article = ARTICLES.find((x) => x.slug === slug) ?? (ARTICLES[0] as Article);
  const toc = articleToc(a.blocks);
  const related = ARTICLES.filter((x) => x.slug !== a.slug).slice(0, 3);

  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState('');
  const [size, setSize] = useState<'md' | 'lg'>('lg');
  const [serif, setSerif] = useState(false);
  const [claps, setClaps] = useState(128);
  const [clapped, setClapped] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Le défilement se fait dans la zone de contenu du shell, pas dans la fenêtre.
    const scroller = host.current?.closest<HTMLElement>('.content');
    if (!scroller) return;
    const onScroll = () => {
      const max = scroller.scrollHeight - scroller.clientHeight;
      setProgress(max > 0 ? Math.min(100, (scroller.scrollTop / max) * 100) : 0);
      const heads = [...(host.current?.querySelectorAll<HTMLElement>('.prose h2, .prose h3') ?? [])];
      const top = scroller.getBoundingClientRect().top + 120;
      const current = heads.filter((h) => h.getBoundingClientRect().top < top).pop();
      setActive(current?.id ?? '');
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => scroller.removeEventListener('scroll', onScroll);
  }, [slug]);

  const goTo = (id: string, e: MouseEvent) => {
    e.preventDefault();
    host.current?.querySelector('#' + CSS.escape(id))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const clap = () => {
    setClaps((n) => n + (clapped ? -1 : 1));
    setClapped((v) => !v);
  };
  const share = () => {
    navigator.clipboard?.writeText(location.href).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  const toComments = () => host.current?.querySelector('#comments')?.scrollIntoView({ behavior: 'smooth' });
  const longDate = new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="ex-page ex-article" ref={host}>
      <div
        className="progress"
        role="progressbar"
        aria-label="Progression de lecture"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: progress + '%' }} />
      </div>

      <header className="hero">
        <nav className="crumbs" aria-label="Fil d’Ariane">
          <Link to="/examples/app/blog">Blog</Link>
          <MaterialIcon name="chevron_right" />
          <span>{a.category}</span>
        </nav>
        <h1>{a.title}</h1>
        <p className="dek">{a.dek}</p>
        <div className="byline">
          <span className="ava" style={{ background: a.author.color }}>
            {initials(a.author.name)}
          </span>
          <div className="who">
            <strong>{a.author.name}</strong>
            <span>
              <time dateTime={a.date}>{longDate}</time> · {a.minutes} min de lecture
            </span>
          </div>
          <span className="spacer" />
          <div className="reading" role="group" aria-label="Réglages de lecture">
            <Tooltip title="Texte standard">
              <button
                type="button"
                className={size === 'md' ? 'on' : ''}
                onClick={() => setSize('md')}
                aria-label="Texte standard"
              >
                <span className="a-sm">A</span>
              </button>
            </Tooltip>
            <Tooltip title="Grand texte">
              <button
                type="button"
                className={size === 'lg' ? 'on' : ''}
                onClick={() => setSize('lg')}
                aria-label="Grand texte"
              >
                <span className="a-lg">A</span>
              </button>
            </Tooltip>
            <i />
            <Tooltip title="Sans empattement">
              <button
                type="button"
                className={!serif ? 'on' : ''}
                onClick={() => setSerif(false)}
                aria-label="Police sans empattement"
              >
                <span className="f-sans">Aa</span>
              </button>
            </Tooltip>
            <Tooltip title="Avec empattement">
              <button
                type="button"
                className={serif ? 'on' : ''}
                onClick={() => setSerif(true)}
                aria-label="Police à empattement"
              >
                <span className="f-serif">Aa</span>
              </button>
            </Tooltip>
          </div>
        </div>
      </header>

      <div className="cover" style={{ '--h': a.hue } as CSSProperties}>
        <MaterialIcon name={a.icon} />
      </div>

      <div className="layout">
        <aside className="toc" aria-label="Sommaire">
          <span className="text-overline">Sommaire</span>
          <ol>
            {toc.map((t) => (
              <li key={t.id} className={t.level === 3 ? 'sub' : ''}>
                <a href={'#' + t.id} onClick={(e) => goTo(t.id, e)} className={active === t.id ? 'on' : ''}>
                  {t.text}
                </a>
              </li>
            ))}
          </ol>
        </aside>

        <article className="main">
          <ArticleBody blocks={a.blocks} size={size} serif={serif} />

          <div className="tags">
            {a.tags.map((t) => (
              <span key={t}>#{t}</span>
            ))}
          </div>

          <section className="author card">
            <span className="ava big" style={{ background: a.author.color }}>
              {initials(a.author.name)}
            </span>
            <div>
              <span className="text-overline">Écrit par</span>
              <h2>{a.author.name}</h2>
              <p>{a.author.bio ?? a.author.role}</p>
            </div>
            <Button variant="outlined" color="inherit">
              Suivre
            </Button>
          </section>

          <section id="comments" className="comments">
            <CommentThread comments={COMMENTS} me={ME} mentionables={PEOPLE} moderator />
          </section>
        </article>

        <aside className="rail" aria-label="Actions">
          <Tooltip title="J’apprécie" placement="left">
            <button type="button" className={clapped ? 'on' : ''} onClick={clap}>
              <MaterialIcon name={clapped ? 'favorite' : 'favorite_border'} />
              <b>{claps}</b>
            </button>
          </Tooltip>
          <Tooltip title="Commentaires" placement="left">
            <button type="button" onClick={toComments}>
              <MaterialIcon name="chat_bubble_outline" />
              <b>{COMMENTS.length}</b>
            </button>
          </Tooltip>
          <Tooltip title="Enregistrer" placement="left">
            <button type="button" className={saved ? 'on' : ''} onClick={() => setSaved((s) => !s)}>
              <MaterialIcon name={saved ? 'bookmark' : 'bookmark_border'} />
            </button>
          </Tooltip>
          <Tooltip title={copied ? 'Lien copié' : 'Copier le lien'} placement="left">
            <button type="button" onClick={share}>
              <MaterialIcon name={copied ? 'check' : 'ios_share'} />
            </button>
          </Tooltip>
        </aside>
      </div>

      <section className="related">
        <h2>À lire ensuite</h2>
        <div className="rel-grid">
          {related.map((r) => (
            <Link key={r.slug} className="card rel" to={`/examples/app/blog/${r.slug}`}>
              <div className="r-art" style={{ '--h': r.hue } as CSSProperties}>
                <MaterialIcon name={r.icon} />
              </div>
              <div className="r-body">
                <span className="cat">{r.category}</span>
                <strong>{r.title}</strong>
                <small>{r.minutes} min de lecture</small>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
