import './skeleton.scss';

export type SkeletonVariant = 'line' | 'card' | 'table-row' | 'avatar';

/** app-skeleton : placeholder « shimmer » sans dépendance externe. */
export function Skeleton({ variant = 'line', count = 3 }: { variant?: SkeletonVariant; count?: number }) {
  const items = Array.from({ length: Math.max(1, count) }, (_, i) => i);
  if (variant === 'card')
    return (
      <div className="kit-skeleton">
        <div className="skeleton-grid">
          {items.map((i) => (
            <div key={i} className="skeleton-block skeleton-card" />
          ))}
        </div>
      </div>
    );
  return (
    <div className="kit-skeleton">
      <div className="skeleton-rows">
        {items.map((i) =>
          variant === 'avatar' ? (
            <div key={i} className="skeleton-avatar-row">
              <div className="skeleton-block skeleton-avatar" />
              <div className="skeleton-avatar-lines">
                <div className="skeleton-block skeleton-line" style={{ width: '60%' }} />
                <div className="skeleton-block skeleton-line" style={{ width: '35%' }} />
              </div>
            </div>
          ) : (
            <div
              key={i}
              className={`skeleton-block ${variant === 'table-row' ? 'skeleton-table-row' : 'skeleton-line'}`}
            />
          ),
        )}
      </div>
    </div>
  );
}

/**
 * Réplique minimale de ngx-skeleton-loader (appearance line | circle, animation progress) :
 * mêmes classes `.skeleton-loader` et styles par défaut que la bibliothèque.
 */
export function NgxSkeleton({
  count = 1,
  appearance = 'line',
  theme,
}: {
  count?: number;
  appearance?: 'line' | 'circle';
  theme?: React.CSSProperties;
}) {
  return (
    <span className="ngx-skeleton-loader">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`skeleton-loader progress${appearance === 'circle' ? ' circle' : ''}`}
          style={theme}
          aria-busy="true"
          aria-valuetext="Loading..."
          role="progressbar"
        />
      ))}
    </span>
  );
}
