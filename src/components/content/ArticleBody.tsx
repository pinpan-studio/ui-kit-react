import { Tooltip } from '@mui/material';
import { useState, type CSSProperties } from 'react';
import { markdownInline } from '../../lib/markdown';
import { MaterialIcon } from '../ui/MaterialIcon';
import { slugify, type ArticleBlock } from './contentModels';
import './article-body.scss';

const CALLOUT_ICON: Record<string, string> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
  neutral: 'lightbulb',
};

const md = (s: string) => ({ __html: markdownInline(s) });

/**
 * Corps d'un article : rend une liste de blocs (chapô, paragraphes, intertitres, citations,
 * exergue, listes, code, figures, encadrés, tableaux) avec la typographie éditoriale du kit.
 */
export function ArticleBody({
  blocks,
  size = 'lg',
  anchors = true,
  serif = false,
  className,
  style,
}: {
  blocks: ArticleBlock[];
  /** Corps de texte : 'md' (16 px, interfaces) ou 'lg' (18 px, lecture longue). */
  size?: 'md' | 'lg';
  /** Ancres « # » au survol des intertitres. */
  anchors?: boolean;
  /** Variante à empattements pour le texte courant (titres inchangés). */
  serif?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const [copied, setCopied] = useState<number | null>(null);
  const copy = (code: string, i: number) => {
    void navigator.clipboard?.writeText(code).catch(() => undefined);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className={`prose size-${size}${serif ? ' serif' : ''}${className ? ' ' + className : ''}`} style={style}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'lead':
            return <p key={i} className="lead" dangerouslySetInnerHTML={md(b.text)} />;
          case 'p':
            return <p key={i} className={b.dropcap ? 'dropcap' : undefined} dangerouslySetInnerHTML={md(b.text)} />;
          case 'h2':
          case 'h3': {
            const id = b.id ?? slugify(b.text);
            const H = b.type;
            return (
              <H key={i} id={id}>
                {b.text}
                {anchors && (
                  <a className="anchor" href={'#' + id} aria-label="Lien vers cette section">
                    #
                  </a>
                )}
              </H>
            );
          }
          case 'quote':
            return (
              <blockquote key={i}>
                <p dangerouslySetInnerHTML={md(b.text)} />
                {b.cite && <cite>— {b.cite}</cite>}
              </blockquote>
            );
          case 'pullquote':
            return (
              <aside key={i} className="pullquote">
                <p>{b.text}</p>
              </aside>
            );
          case 'list': {
            const L = b.ordered ? 'ol' : 'ul';
            return (
              <L key={i}>
                {b.items.map((it, j) => (
                  <li key={j} dangerouslySetInnerHTML={md(it)} />
                ))}
              </L>
            );
          }
          case 'code':
            return (
              <figure key={i} className="code">
                <figcaption>
                  <span className="dots">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="fname">{b.filename ?? b.lang ?? 'code'}</span>
                  {b.lang && <span className="lang">{b.lang}</span>}
                  <Tooltip title={copied === i ? 'Copié' : 'Copier'}>
                    <button type="button" onClick={() => copy(b.code, i)} aria-label="Copier">
                      <MaterialIcon name={copied === i ? 'check' : 'content_copy'} />
                    </button>
                  </Tooltip>
                </figcaption>
                <pre>
                  <code>{b.code}</code>
                </pre>
              </figure>
            );
          case 'figure':
            return (
              <figure key={i} className={`figure${b.wide ? ' wide' : ''}`}>
                <div className="art" style={{ '--h': b.hue ?? 190 } as CSSProperties}>
                  <MaterialIcon name={b.icon} />
                </div>
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );
          case 'callout':
            return (
              <div key={i} className={`callout ${b.tone}`} role="note">
                <MaterialIcon name={CALLOUT_ICON[b.tone] ?? 'info'} />
                <div>
                  {b.title && <strong>{b.title}</strong>}
                  <p dangerouslySetInnerHTML={md(b.text)} />
                </div>
              </div>
            );
          case 'table':
            return (
              <div key={i} className="table-wrap">
                <table>
                  {b.caption && <caption>{b.caption}</caption>}
                  <thead>
                    <tr>
                      {b.head.map((h, j) => (
                        <th key={j}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j}>
                        {r.map((c, k) => (
                          <td key={k} dangerouslySetInnerHTML={md(c)} />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'divider':
            return <hr key={i} />;
        }
      })}
    </div>
  );
}
