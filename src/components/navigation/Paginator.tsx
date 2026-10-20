import { IconButton, Tooltip } from '@mui/material';
import { MaterialIcon } from '../ui/MaterialIcon';
import { visiblePages } from './paginatorPages';
import './paginator.scss';

export interface PaginatorProps {
  total: number;
  page: number;
  itemPerPage?: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

/** Pagination du kit (app-paginator) : taille de page, plage, numéros avec ellipses. */
export function Paginator({
  total,
  page,
  itemPerPage = 20,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
}: PaginatorProps) {
  const nbPage = Math.max(1, Math.ceil(total / itemPerPage));
  const start = total === 0 ? 0 : (page - 1) * itemPerPage + 1;
  const end = Math.min(page * itemPerPage, total);
  const go = (p: number) => {
    if (p >= 1 && p <= nbPage && p !== page) onPageChange?.(p);
  };
  const nav = (title: string, icon: string, target: number, disabled: boolean) => (
    <Tooltip title={title}>
      <span>
        <IconButton disabled={disabled} onClick={() => go(target)} aria-label={title}>
          <MaterialIcon name={icon} />
        </IconButton>
      </span>
    </Tooltip>
  );
  return (
    <div className="m3-paginator">
      <div className="paginator-size">
        <span className="paginator-label">Éléments par page:</span>
        <div className="select-wrapper">
          <select
            value={itemPerPage}
            aria-label="Éléments par page"
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
          >
            {pageSizeOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <MaterialIcon name="arrow_drop_down" className="select-arrow" />
        </div>
      </div>
      <span className="paginator-range">
        {start}–{end} sur {total} éléments
      </span>
      <div className="paginator-buttons">
        {nav('Première page', 'first_page', 1, page === 1)}
        {nav('Précédent', 'chevron_left', page - 1, page === 1)}
        {visiblePages(page, nbPage).map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="paginator-ellipsis">
              ...
            </span>
          ) : (
            <IconButton
              key={p}
              className={`page-num-btn${p === page ? ' active' : ''}`}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => go(p)}
            >
              {p}
            </IconButton>
          ),
        )}
        {nav('Suivant', 'chevron_right', page + 1, page === nbPage)}
        {nav('Dernière page', 'last_page', nbPage, page === nbPage)}
      </div>
    </div>
  );
}
