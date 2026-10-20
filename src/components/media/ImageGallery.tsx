import { Tooltip } from '@mui/material';
import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { MaterialIcon } from '../ui/MaterialIcon';
import { useFileViewer } from './FileViewer';
import { MasonryGrid } from './MasonryGrid';
import type { GalleryImage, ImageGalleryLayout } from './mediaTypes';
import './image-gallery.scss';

interface JustifiedRow {
  items: { img: GalleryImage; index: number; w: number }[];
  height: number;
}

/**
 * app-image-gallery : grille régulière, lignes justifiées ou masonry ; filtres par catégorie, légende au survol,
 * sélection multiple, « Afficher plus », ouverture dans la visionneuse plein écran.
 */
export function ImageGallery({
  images = [],
  layout: layoutInput = 'grid',
  switcher = false,
  filters = false,
  selectable = false,
  minWidth = 200,
  aspectRatio = '1 / 1',
  rowHeight = 200,
  gap = 8,
  pageSize = 0,
  onSelectionChange,
  selectionActions,
  className,
}: {
  images?: GalleryImage[];
  layout?: ImageGalleryLayout;
  switcher?: boolean;
  filters?: boolean;
  selectable?: boolean;
  minWidth?: number;
  aspectRatio?: string;
  rowHeight?: number;
  gap?: number;
  pageSize?: number;
  onSelectionChange?: (s: GalleryImage[]) => void;
  /** Équivalent du slot `[selectionActions]`. */
  selectionActions?: ReactNode;
  className?: string;
}) {
  const viewer = useFileViewer();
  const stage = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState(layoutInput);
  useEffect(() => setLayout(layoutInput), [layoutInput]);
  const [category, setCat] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<GalleryImage>>(new Set());
  const [shown, setShown] = useState(pageSize || Infinity);
  useEffect(() => setShown(pageSize || Infinity), [pageSize]);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.floor(el.getBoundingClientRect().width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const categories = useMemo(() => {
    const m = new Map<string, number>();
    images.forEach((i) => {
      if (i.category) m.set(i.category, (m.get(i.category) ?? 0) + 1);
    });
    return [...m.entries()].map(([name, count]) => ({ name, count }));
  }, [images]);
  const filtered = useMemo(() => images.filter((i) => !category || i.category === category), [images, category]);
  const visible = useMemo(() => filtered.slice(0, shown), [filtered, shown]);
  const remaining = Math.max(0, filtered.length - visible.length);

  /** Lignes justifiées : on remplit chaque ligne jusqu'à la largeur, puis on ajuste sa hauteur. */
  const rows = useMemo<JustifiedRow[]>(() => {
    const W = width,
      target = rowHeight;
    if (!W) return [];
    const out: JustifiedRow[] = [];
    let row: { img: GalleryImage; index: number; ratio: number }[] = [];
    let sum = 0;
    const flush = (last: boolean) => {
      if (!row.length) return;
      const avail = W - gap * (row.length - 1);
      const h = last && sum * target < avail ? target : avail / sum;
      out.push({
        height: Math.round(h),
        items: row.map((r) => ({ img: r.img, index: r.index, w: Math.floor(r.ratio * h) })),
      });
      row = [];
      sum = 0;
    };
    visible.forEach((img, index) => {
      const ratio = (img.width ?? 4) / (img.height ?? 3);
      row.push({ img, index, ratio });
      sum += ratio;
      if (sum * target + gap * (row.length - 1) >= W) flush(false);
    });
    flush(true);
    return out;
  }, [width, rowHeight, gap, visible]);

  const open = (index: number) =>
    viewer(
      visible.map((i, k) => ({ name: i.name ?? i.title ?? `image-${k + 1}.jpg`, url: i.url, type: 'image/jpeg' })),
      index,
    );
  const toggle = (img: GalleryImage, e?: { stopPropagation: () => void }) => {
    e?.stopPropagation();
    const s = new Set(selected);
    if (s.has(img)) s.delete(img);
    else s.add(img);
    setSelected(s);
    onSelectionChange?.([...s]);
  };
  const click = (img: GalleryImage, index: number, e: MouseEvent) => {
    if (selectable && (selected.size || e.shiftKey || e.metaKey || e.ctrlKey)) toggle(img);
    else open(index);
  };
  const setCategory = (c: string | null) => {
    setCat(c);
    setShown(pageSize || Infinity);
  };

  const tile = (img: GalleryImage, i: number, ratio: string | undefined) => (
    <figure
      className={`ig-tile${selected.has(img) ? ' sel' : ''}`}
      style={{ aspectRatio: ratio }}
      tabIndex={0}
      role="button"
      aria-label={img.title || img.alt || 'Image ' + (i + 1)}
      onClick={(e) => click(img, i, e)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') open(i);
        if (e.key === ' ') {
          if (selectable) toggle(img, e);
          else open(i);
          e.preventDefault();
        }
      }}
    >
      <img src={img.url} alt={img.alt || img.title || ''} loading="lazy" decoding="async" draggable={false} />
      <figcaption>
        {img.title && <strong>{img.title}</strong>}
        {img.caption && <span>{img.caption}</span>}
      </figcaption>
      <span className="ig-zoom">
        <MaterialIcon name="zoom_in" />
      </span>
      {selectable && (
        <button
          type="button"
          className={`ig-check${selected.has(img) ? ' on' : ''}`}
          onClick={(e) => toggle(img, e)}
          aria-pressed={selected.has(img)}
          aria-label="Sélectionner"
        >
          <MaterialIcon name="check" />
        </button>
      )}
    </figure>
  );
  const sw = (l: ImageGalleryLayout, tip: string, icon: string) => (
    <Tooltip title={tip}>
      <button type="button" className={layout === l ? 'on' : undefined} onClick={() => setLayout(l)}>
        <MaterialIcon name={icon} />
      </button>
    </Tooltip>
  );

  return (
    <div className={className ? `app-image-gallery ${className}` : 'app-image-gallery'}>
      <div className="ig">
        {(filters || switcher || selected.size > 0) && (
          <div className="ig-bar">
            {selected.size ? (
              <div className="ig-selbar">
                <Tooltip title="Désélectionner">
                  <button
                    type="button"
                    className="ig-icon"
                    onClick={() => {
                      setSelected(new Set());
                      onSelectionChange?.([]);
                    }}
                  >
                    <MaterialIcon name="close" />
                  </button>
                </Tooltip>
                <strong>{selected.size} sélectionnée(s)</strong>
                <button
                  type="button"
                  className="ig-link"
                  onClick={() => {
                    setSelected(new Set(filtered));
                    onSelectionChange?.(filtered);
                  }}
                >
                  Tout sélectionner ({filtered.length})
                </button>
                <span className="spacer" />
                {selectionActions}
              </div>
            ) : (
              <>
                {filters && categories.length > 0 && (
                  <div className="ig-chips" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      className={!category ? 'on' : undefined}
                      onClick={() => setCategory(null)}
                    >
                      Toutes <em>{images.length}</em>
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        role="tab"
                        className={category === c.name ? 'on' : undefined}
                        onClick={() => setCategory(c.name)}
                      >
                        {c.name} <em>{c.count}</em>
                      </button>
                    ))}
                  </div>
                )}
                <span className="spacer" />
                {switcher && (
                  <div className="ig-switch" role="radiogroup" aria-label="Disposition">
                    {sw('grid', 'Grille', 'grid_view')}
                    {sw('justified', 'Lignes justifiées', 'view_compact')}
                    {sw('masonry', 'Masonry', 'dashboard')}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        <div ref={stage} className="ig-stage">
          {layout === 'grid' ? (
            <div
              className="ig-grid"
              style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${minWidth}px), 1fr))`, gap }}
            >
              {visible.map((img, i) => (
                <div key={img.url} style={{ display: 'contents' }}>
                  {tile(img, i, aspectRatio)}
                </div>
              ))}
            </div>
          ) : layout === 'justified' ? (
            <div className="ig-rows" style={{ gap }}>
              {rows.map((row, r) => (
                <div key={r} className="ig-row" style={{ gap, height: row.height }}>
                  {row.items.map((c) => (
                    <div key={c.img.url} className="ig-cell" style={{ width: c.w }}>
                      {tile(c.img, c.index, undefined)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <MasonryGrid
              items={visible}
              minColumnWidth={minWidth + 40}
              gap={gap}
              trackBy={(img) => img.url}
              renderItem={(img, i) => tile(img, i, `${img.width ?? 4} / ${img.height ?? 3}`)}
            />
          )}
          {!visible.length && (
            <div className="ig-empty">
              <MaterialIcon name="hide_image" />
              <strong>Aucune image</strong>
              <span>Aucune image dans cette catégorie.</span>
            </div>
          )}
        </div>
        {remaining > 0 && (
          <div className="ig-more">
            <button type="button" onClick={() => setShown((n) => n + (pageSize || Infinity))}>
              <MaterialIcon name="expand_more" />
              Afficher plus <em>{remaining} restante(s)</em>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
