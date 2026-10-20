import { Button, Checkbox, Chip, FormControlLabel, IconButton, Radio, RadioGroup, Switch } from '@mui/material';
import { useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { EmptyState } from '../../../../components/feedback/EmptyState';
import { useSnackbar } from '../../../../components/feedback/useSnackbar';
import { BoxSelect } from '../../../../components/fields/BoxSelect';
import { RangeSlider } from '../../../../components/fields/RangeSlider';
import { Rating } from '../../../../components/fields/Rating';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import { EX_CATEGORIES, EX_PRODUCTS, type ExProduct } from '../../../../data/static/examples.data';
import '../../ex-page.scss';
import './catalog.scss';

type RangeValue = [number, number];
const PRICE_MIN = 60_000;
const PRICE_MAX = 420_000;
const SORTS = [
  { value: 'pop', label: 'Pertinence' },
  { value: 'asc', label: 'Prix croissant' },
  { value: 'desc', label: 'Prix décroissant' },
  { value: 'rating', label: 'Mieux notés' },
];
/** Répartition des prix (12 tranches) pour l'histogramme du filtre. */
const HISTOGRAM = Array.from({ length: 12 }, (_, i) => {
  const w = (PRICE_MAX - PRICE_MIN) / 12;
  return EX_PRODUCTS.filter((p) => p.price >= PRICE_MIN + i * w && p.price < PRICE_MIN + (i + 1) * w).length;
});
const fmtPrice = (v: number) => Math.round(v / 1000) + ' k';
const fr = (n: number, min = 0, max = min) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: min, maximumFractionDigits: max });
const countCat = (c: string) => EX_PRODUCTS.filter((p) => p.category === c).length;
const toggle = (s: Set<string>, v: string) => {
  const n = new Set(s);
  if (n.has(v)) n.delete(v);
  else n.add(v);
  return n;
};

/** /examples/app/catalog — navigation haute, facettes (catégories, prix avec histogramme, note, stock), filtres actifs, grille produits. */
export function CatalogPage() {
  const navigate = useNavigate();
  const snack = useSnackbar();
  const [cats, setCats] = useState(new Set<string>());
  const [price, setPrice] = useState<RangeValue>([PRICE_MIN, PRICE_MAX]);
  const [minRating, setMinRating] = useState(0);
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState('pop');
  const [favs, setFavs] = useState(new Set<string>(['p-3']));
  const [cart, setCart] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const priceActive = price[0] > PRICE_MIN || price[1] < PRICE_MAX;
  const activeCount = cats.size + (priceActive ? 1 : 0) + (minRating ? 1 : 0) + (inStock ? 1 : 0);
  const products = useMemo(() => {
    const [lo, hi] = price;
    const list = EX_PRODUCTS.filter(
      (p) =>
        (!cats.size || cats.has(p.category)) &&
        p.price >= lo &&
        p.price <= hi &&
        p.rating >= minRating &&
        (!inStock || p.stock > 0),
    );
    return sort === 'pop'
      ? list
      : [...list].sort((a, b) =>
          sort === 'asc' ? a.price - b.price : sort === 'desc' ? b.price - a.price : b.rating - a.rating,
        );
  }, [cats, price, minRating, inStock, sort]);

  const reset = () => {
    setCats(new Set());
    setPrice([PRICE_MIN, PRICE_MAX]);
    setMinRating(0);
    setInStock(false);
  };
  const toCheckout = () => void navigate('/examples/forms/checkout');
  const add = (p: ExProduct) => {
    setCart((n) => n + 1);
    snack(`« ${p.name} » ajouté au panier`, { action: 'Commander', duration: 3000, onAction: toCheckout });
  };

  return (
    <div className="ex-page ex-catalog">
      <div className="page-head">
        <div className="titles">
          <span className="eyebrow">Matériel & accessoires</span>
          <h1>Catalogue</h1>
          <p>Livraison sous 48 h à Abidjan · retours gratuits sous 14 jours</p>
        </div>
        <div className="actions">
          <Button
            variant="outlined"
            color="inherit"
            className="cart"
            onClick={toCheckout}
            disabled={!cart}
            startIcon={<MaterialIcon name="shopping_bag" />}
          >
            Panier{cart > 0 && <span className="cart-n">{cart}</span>}
          </Button>
        </div>
      </div>

      <div className="layout">
        <aside className={`facets${showFilters ? ' open' : ''}`} aria-label="Filtres">
          <div className="f-head">
            <h2>Filtres</h2>
            {activeCount > 0 && <Button onClick={reset}>Réinitialiser</Button>}
          </div>
          <section className="f-group">
            <h3>Catégorie</h3>
            {EX_CATEGORIES.map((c) => (
              <FormControlLabel
                key={c}
                className="f-check"
                control={<Checkbox checked={cats.has(c)} onChange={() => setCats((s) => toggle(s, c))} />}
                label={
                  <>
                    {c}
                    <span className="n">{countCat(c)}</span>
                  </>
                }
              />
            ))}
          </section>
          <section className="f-group">
            <h3>Prix</h3>
            <RangeSlider
              value={price}
              onChange={setPrice}
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={10000}
              histogram={HISTOGRAM}
              inputs={false}
              format={fmtPrice}
            />
            <div className="range-val">
              <span>{fr(price[0])} F</span>
              <span>{fr(price[1])} F</span>
            </div>
          </section>
          <section className="f-group">
            <h3>Note minimale</h3>
            <RadioGroup className="ratings" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
              {[0, 4, 4.5].map((r) => (
                <FormControlLabel
                  key={r}
                  value={r}
                  control={<Radio />}
                  label={
                    r ? (
                      <>
                        <span className="rating-ic">
                          <Rating value={r} readonly half size="small" />
                        </span>{' '}
                        {fr(r, 0, 1)} et plus
                      </>
                    ) : (
                      'Toutes les notes'
                    )
                  }
                />
              ))}
            </RadioGroup>
          </section>
          <section className="f-group">
            <FormControlLabel
              control={<Switch checked={inStock} onChange={(e) => setInStock(e.target.checked)} />}
              label="En stock uniquement"
            />
          </section>
          <Button variant="contained" disableElevation className="apply" onClick={() => setShowFilters(false)}>
            Voir {products.length} article(s)
          </Button>
        </aside>
        <div className={`scrim${showFilters ? ' open' : ''}`} onClick={() => setShowFilters(false)} />

        <section className="results">
          <div className="r-bar">
            <Button
              variant="outlined"
              color="inherit"
              className="filters-btn"
              onClick={() => setShowFilters(true)}
              startIcon={<MaterialIcon name="tune" />}
            >
              Filtres{activeCount > 0 && ` · ${activeCount}`}
            </Button>
            <span className="count">
              <strong>{products.length}</strong> article(s)
            </span>
            <span className="spacer" />
            <div className="form-field sort">
              <div className="field-box select-box">
                <BoxSelect value={sort} onChange={(v) => setSort(v)} options={SORTS} ariaLabel="Trier par" />
              </div>
            </div>
          </div>

          {activeCount > 0 && (
            <div className="active" aria-label="Filtres actifs">
              {[...cats].map((c) => (
                <Chip
                  key={c}
                  label={c}
                  onDelete={() => setCats((s) => toggle(s, c))}
                  deleteIcon={<MaterialIcon name="cancel" aria-label={'Retirer ' + c} />}
                />
              ))}
              {priceActive && (
                <Chip
                  label={`${fmtPrice(price[0])} – ${fmtPrice(price[1])}`}
                  onDelete={() => setPrice([PRICE_MIN, PRICE_MAX])}
                  deleteIcon={<MaterialIcon name="cancel" aria-label="Retirer le filtre de prix" />}
                />
              )}
              {minRating > 0 && (
                <Chip
                  label={`${fr(minRating, 0, 1)} ★ et plus`}
                  onDelete={() => setMinRating(0)}
                  deleteIcon={<MaterialIcon name="cancel" aria-label="Retirer le filtre de note" />}
                />
              )}
              {inStock && (
                <Chip
                  label="En stock"
                  onDelete={() => setInStock(false)}
                  deleteIcon={<MaterialIcon name="cancel" aria-label="Retirer le filtre de stock" />}
                />
              )}
            </div>
          )}

          <div className="grid">
            {products.map((p) => (
              <article key={p.id} className="card product">
                <div className="visual" style={{ '--h': p.hue } as CSSProperties}>
                  <MaterialIcon name={p.icon} />
                  {p.badge && <span className={`badge${p.badge.startsWith('-') ? ' promo' : ''}`}>{p.badge}</span>}
                  <IconButton
                    className={`fav${favs.has(p.id) ? ' on' : ''}`}
                    onClick={() => setFavs((s) => toggle(s, p.id))}
                    aria-pressed={favs.has(p.id)}
                    aria-label={'Favori : ' + p.name}
                  >
                    <MaterialIcon name={favs.has(p.id) ? 'favorite' : 'favorite_border'} />
                  </IconButton>
                </div>
                <div className="p-body">
                  <span className="cat">{p.category}</span>
                  <h3>{p.name}</h3>
                  <span className="rating">
                    <Rating value={p.rating} readonly half size="small" />
                    <span>{fr(p.rating, 1)}</span>
                  </span>
                  <div className="p-foot">
                    <span className="price">
                      {fr(p.price)}
                      <small>FCFA</small>
                    </span>
                    {!p.stock ? (
                      <span className="stock out">Rupture</span>
                    ) : (
                      p.stock < 8 && <span className="stock low">Plus que {p.stock}</span>
                    )}
                  </div>
                  <Button
                    variant="outlined"
                    color="inherit"
                    className="add"
                    disabled={!p.stock}
                    onClick={() => add(p)}
                    startIcon={<MaterialIcon name="add_shopping_cart" />}
                  >
                    Ajouter
                  </Button>
                </div>
              </article>
            ))}
            {products.length === 0 && (
              <div className="card empty">
                <EmptyState
                  icon="filter_alt_off"
                  title="Aucun article"
                  subtitle="Élargissez vos filtres pour voir plus de résultats."
                  actionLabel="Réinitialiser les filtres"
                  onAction={reset}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
