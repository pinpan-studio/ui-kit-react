import type { CSSProperties } from 'react';
import { useSnackbar } from '../feedback/useSnackbar';
import { Tip } from '../fields/Tip';
import { MaterialIcon } from '../ui/MaterialIcon';
import type { DescriptionItem } from './descriptionTypes';
import './description-list.scss';

const isEmpty = (v: unknown) => v === null || v === undefined || v === '';

/**
 * app-description-list : clé / valeur des fiches détail, grille 1 à 4 colonnes, verticale ou horizontale,
 * bordée ou rayée, valeurs typées, copie en un clic, valeur vide « — ».
 */
export function DescriptionList({
  items,
  title = '',
  columns = 3,
  layout = 'vertical',
  bordered = false,
  striped = false,
}: {
  items: DescriptionItem[];
  title?: string;
  columns?: number;
  layout?: 'vertical' | 'horizontal';
  bordered?: boolean;
  striped?: boolean;
}) {
  const snack = useSnackbar();
  const copy = (it: DescriptionItem) => {
    void navigator.clipboard?.writeText(String(it.value));
    snack(`${it.label} copié`, { action: '', duration: 1500 });
  };
  return (
    <div className="app-description-list">
      {title && <div className="dl-title">{title}</div>}
      <dl
        className={`dl dl--${layout}${bordered ? ' bordered' : ''}${striped ? ' striped' : ''}`}
        style={{ '--cols': columns } as CSSProperties}
      >
        {items.map((it) => (
          <div
            key={it.label}
            className="dl-item"
            style={{ gridColumn: it.span === 'full' ? '1 / -1' : it.span ? `span ${it.span}` : undefined }}
          >
            <dt>
              {it.icon && <MaterialIcon name={it.icon} />}
              {it.label}
            </dt>
            <dd className={isEmpty(it.value) ? 'empty' : undefined}>
              {isEmpty(it.value) ? (
                ' — '
              ) : (
                <>
                  {it.type === 'mono' ? (
                    <code>{it.value}</code>
                  ) : it.type === 'link' ? (
                    <a href={it.href || String(it.value)} target="_blank" rel="noopener">
                      {it.value}
                      <MaterialIcon name="open_in_new" />
                    </a>
                  ) : it.type === 'email' ? (
                    <a href={`mailto:${it.value}`}>{it.value}</a>
                  ) : it.type === 'phone' ? (
                    <a href={'tel:' + String(it.value).replace(/\s/g, '')}>{it.value}</a>
                  ) : it.type === 'badge' ? (
                    <span
                      className="dl-badge"
                      style={{ '--tone': `var(--${it.tone || 'primary'}-color)` } as CSSProperties}
                    >
                      {it.value}
                    </span>
                  ) : it.type === 'multiline' ? (
                    <span className="ml">{it.value}</span>
                  ) : (
                    <> {it.value} </>
                  )}
                  {it.copy && (
                    <Tip title="Copier">
                      <button type="button" className="dl-copy" onClick={() => copy(it)}>
                        <MaterialIcon name="content_copy" />
                      </button>
                    </Tip>
                  )}
                </>
              )}
              {it.hint && <small>{it.hint}</small>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
