import { IconButton, Tooltip } from '@mui/material';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { useSnackbar } from '../../../components/feedback/useSnackbar';
import './doc.scss';

export interface TocItem {
  id: string;
  label: string;
}

/** En-tête + sommaire d'une page de documentation du catalogue (kit-doc-page). */
export function DocPage({
  title,
  subtitle,
  icon = 'widgets',
  eyebrow = 'Composants',
  toc = [],
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  eyebrow?: string;
  toc?: TocItem[];
  className?: string;
  children: ReactNode;
}) {
  const { hash } = useLocation();
  // Le contenu défile dans un conteneur (pas la fenêtre) : on gère nous-mêmes les ancres #fragment.
  useEffect(() => {
    if (!hash) return;
    const t = setTimeout(
      () => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      60,
    );
    return () => clearTimeout(t);
  }, [hash]);
  useEffect(() => {
    document.title = `${title} · UI Kit`;
  }, [title]);

  return (
    <div className={`doc-page gallery ${className ?? ''}`}>
      <header className="doc-hero">
        <div className="hero-icon">
          <MaterialIcon name={icon} />
        </div>
        <div className="hero-text">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </header>
      {toc.length > 0 && (
        <nav className="doc-toc" aria-label="Sommaire">
          {toc.map((t) => (
            <Link key={t.id} to={{ hash: t.id }} className="toc-chip">
              {t.label}
            </Link>
          ))}
        </nav>
      )}
      {children}
    </div>
  );
}

/** Section documentée (kit-section). */
export function DocSection({
  id,
  title,
  description,
  source,
  cols = 1,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  source?: string;
  cols?: 1 | 2 | 3;
  children: ReactNode;
}) {
  return (
    <section className="doc-section" id={id}>
      <div className="section-head">
        <h2>{title}</h2>
        {source && (
          <code className="source" title={`Source : ${source}`}>
            {source}
          </code>
        )}
      </div>
      {description && <p className="section-desc">{description}</p>}
      <div className={`section-body${cols === 2 ? ' cols-2' : ''}${cols === 3 ? ' cols-3' : ''}`}>{children}</div>
    </section>
  );
}

/** Cadre de démonstration d'une variante, avec extrait de code copiable (kit-demo). */
export function Demo({
  label,
  hint,
  code,
  flush,
  muted,
  dense,
  children,
}: {
  label: string;
  hint?: string;
  code?: string;
  flush?: boolean;
  muted?: boolean;
  dense?: boolean;
  children: ReactNode;
}) {
  const [showCode, setShowCode] = useState(false);
  const snack = useSnackbar();
  const copy = () => {
    void navigator.clipboard?.writeText(code?.trim() ?? '');
    snack('Extrait copié dans le presse-papiers');
  };
  return (
    <div className={`demo${dense ? ' dense' : ''}`}>
      <div className="demo-head">
        <span className="demo-label">{label}</span>
        {hint && <span className="demo-hint">{hint}</span>}
        <span className="spacer" />
        {code && (
          <Tooltip title={showCode ? 'Masquer le code' : 'Voir le code'}>
            <IconButton
              className="demo-btn"
              onClick={() => setShowCode((s) => !s)}
              aria-label={showCode ? 'Masquer le code' : 'Voir le code'}
            >
              <MaterialIcon name={showCode ? 'code_off' : 'code'} />
            </IconButton>
          </Tooltip>
        )}
      </div>
      <div className={`demo-stage${flush ? ' pad-none' : ''}${muted ? ' stage-muted' : ''}`}>{children}</div>
      {code && showCode && (
        <div className="demo-code">
          <Tooltip title="Copier">
            <IconButton className="copy-btn" onClick={copy} aria-label="Copier">
              <MaterialIcon name="content_copy" />
            </IconButton>
          </Tooltip>
          <pre>
            <code>{code.trim()}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
