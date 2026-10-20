import { Button, Checkbox, CircularProgress, FormControlLabel, Tooltip } from '@mui/material';
import { useState, type CSSProperties } from 'react';
import { QrCode } from '../../../../components/data/QrCode';
import { Result } from '../../../../components/feedback/Result';
import { BoxSelect } from '../../../../components/fields/BoxSelect';
import { NumberStepper } from '../../../../components/fields/NumberStepper';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import '../../ex-page.scss';
import '../form-page.scss';
import './checkout.scss';

type Pay = 'orange' | 'mtn' | 'wave' | 'card';

const STEPS = ['Panier', 'Livraison & paiement', 'Confirmation'];
const ITEMS = [
  { name: 'Casque sans fil Pro', variant: 'Noir', price: 60000, qty: 1, icon: 'headphones', hue: 210 },
  { name: 'Clavier mécanique', variant: 'FR · AZERTY', price: 105000, qty: 1, icon: 'keyboard', hue: 280 },
  { name: 'Routeur Wi-Fi 6', variant: 'Bi-bande', price: 75000, qty: 2, icon: 'router', hue: 140 },
];
const SHIPPINGS = [
  { id: 'std', label: 'Standard', hint: 'Livré en 48 h à Abidjan', price: 2000, icon: 'local_shipping' },
  { id: 'exp', label: 'Express', hint: 'Livré demain avant 12 h', price: 5000, icon: 'bolt' },
  { id: 'pick', label: 'Retrait en point relais', hint: 'Plateau, Cocody, Marcory', price: 0, icon: 'storefront' },
];
const PAYS: { id: Pay; label: string; hint: string; mark: string; color: string }[] = [
  { id: 'orange', label: 'Orange Money', hint: 'Confirmation par USSD', mark: 'OM', color: '#ff7900' },
  { id: 'mtn', label: 'MTN MoMo', hint: 'Confirmation par SMS', mark: 'MTN', color: '#ffcc00' },
  { id: 'wave', label: 'Wave', hint: 'Sans frais', mark: 'W', color: '#1dc3ff' },
  { id: 'card', label: 'Carte bancaire', hint: 'Visa, Mastercard', mark: '💳', color: '#334155' },
];
const CITIES = ['Abidjan', 'Bouaké', 'San Pedro', 'Yamoussoukro'].map((c) => ({ value: c, label: c }));
const fr = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });

/** /examples/forms/checkout — commande en une page : coordonnées, livraison, paiement (Mobile Money / carte), récapitulatif collant. */
export function CheckoutFormPage() {
  const [items, setItems] = useState(ITEMS);
  const [shipping, setShipping] = useState('std');
  const [pay, setPay] = useState<Pay>('orange');
  const [m, setM] = useState({
    email: 'jean.kouassi@example.com',
    phone: '07 07 12 34 56',
    name: 'Jean Kouassi',
    address: 'Rue des Jardins, Cocody Deux-Plateaux',
    city: 'Abidjan',
    notes: '',
    momo: '07 07 12 34 56',
    card: '',
    exp: '',
    cvc: '',
    sameBilling: true,
    save: true,
  });
  const [promo, setPromo] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoMsg, setPromoMsg] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [state, setState] = useState<'form' | 'waiting' | 'done'>('form');
  const set = (p: Partial<typeof m>) => setM((x) => ({ ...x, ...p }));

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const payLabel = PAYS.find((p) => p.id === pay)?.label ?? '';
  const shippingPrice = SHIPPINGS.find((s) => s.id === shipping)?.price ?? 0;
  const total = subtotal - discount + shippingPrice;

  const setQty = (i: number, qty: number) =>
    setItems((l) => l.map((x, j) => (j === i ? { ...x, qty } : x)).filter((x) => x.qty > 0));
  const remove = (i: number) => setItems((l) => l.filter((_, j) => j !== i));
  const applyPromo = () => {
    if (promo.trim().toUpperCase() === 'AKWABA10') {
      setDiscount(Math.round(subtotal * 0.1));
      setPromoMsg('ok');
    } else {
      setDiscount(0);
      setPromoMsg('ko');
    }
  };
  /** Formatage à la saisie : 4242 4242 4242 4242 et MM / AA. */
  const formatCard = (v: string) =>
    set({
      card: v
        .replace(/\D/g, '')
        .slice(0, 16)
        .replace(/(\d{4})(?=\d)/g, '$1 '),
    });
  const formatExp = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    set({ exp: d.length > 2 ? d.slice(0, 2) + ' / ' + d.slice(2) : d });
  };
  const placeOrder = () => {
    setState('waiting');
    setTimeout(() => setState('done'), pay === 'card' ? 1200 : 2600);
  };

  return (
    <div className="ex-page ex-form ex-checkout">
      <ol className="steps" aria-label="Étapes">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className={`${i === 0 || state === 'done' ? 'done' : ''}${(i === 1 && state !== 'done') || (i === 2 && state === 'done') ? ' on' : ''}`}
          >
            <span className="dot">
              {i === 0 || (state === 'done' && i < 2) ? <MaterialIcon name="check" /> : i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>

      {state === 'done' ? (
        <section className="card done">
          <Result
            status="success"
            icon="check"
            title="Commande confirmée"
            actions={
              <Button variant="contained" disableElevation onClick={() => setState('form')}>
                Retour à la boutique
              </Button>
            }
          >
            <p className="result-text">
              Commande <code>CMD-2026-10482</code> · {fr(total)} FCFA payés via {payLabel}. Un SMS de suivi a été envoyé
              au {m.phone}.
            </p>
            <div className="track">
              <QrCode value="https://scstorage.ci/suivi/CMD-2026-10482" size={120} caption="Suivi de livraison" />
            </div>
          </Result>
        </section>
      ) : (
        <div className="layout">
          <form
            className="main"
            onSubmit={(e) => {
              e.preventDefault();
              placeOrder();
            }}
          >
            <section className="card section">
              <h2>
                <span className="num">1</span>Coordonnées
              </h2>
              <div className="row-2">
                <div className="form-field">
                  <label className="field-label">E-mail</label>
                  <div className="field-box">
                    <MaterialIcon name="mail" />
                    <input
                      name="email"
                      type="email"
                      value={m.email}
                      onChange={(e) => set({ email: e.target.value })}
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label className="field-label">Téléphone</label>
                  <div className="field-box">
                    <span className="prefix">+225</span>
                    <input
                      name="phone"
                      type="tel"
                      value={m.phone}
                      onChange={(e) => set({ phone: e.target.value })}
                      autoComplete="tel-national"
                    />
                  </div>
                  <span className="help">Pour le livreur et le suivi par SMS.</span>
                </div>
              </div>
            </section>

            <section className="card section">
              <h2>
                <span className="num">2</span>Livraison
              </h2>
              <div className="row-2">
                <div className="form-field">
                  <label className="field-label">Destinataire</label>
                  <div className="field-box">
                    <MaterialIcon name="person" />
                    <input
                      name="name"
                      value={m.name}
                      onChange={(e) => set({ name: e.target.value })}
                      autoComplete="name"
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label className="field-label">Ville</label>
                  <div className="field-box select-box">
                    <MaterialIcon name="location_city" />
                    <BoxSelect value={m.city} onChange={(v) => set({ city: v })} options={CITIES} ariaLabel="Ville" />
                  </div>
                </div>
              </div>
              <div className="form-field">
                <label className="field-label">Adresse</label>
                <div className="field-box">
                  <MaterialIcon name="home" />
                  <input
                    name="address"
                    value={m.address}
                    onChange={(e) => set({ address: e.target.value })}
                    autoComplete="street-address"
                  />
                </div>
              </div>
              <div className="form-field">
                <label className="field-label">
                  Indications pour le livreur <span className="help">(facultatif)</span>
                </label>
                <div className="field-box textarea-box">
                  <textarea
                    name="notes"
                    rows={2}
                    value={m.notes}
                    onChange={(e) => set({ notes: e.target.value })}
                    placeholder="Portail bleu, à côté de la pharmacie…"
                  />
                </div>
              </div>
              <div className="choices" role="radiogroup" aria-label="Mode de livraison">
                {SHIPPINGS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    className={`choice${shipping === s.id ? ' on' : ''}`}
                    aria-checked={shipping === s.id}
                    onClick={() => setShipping(s.id)}
                  >
                    <span className="c-ic">
                      <MaterialIcon name={s.icon} />
                    </span>
                    <span className="c-txt">
                      <strong>{s.label}</strong>
                      <small>{s.hint}</small>
                      <b className="price">{s.price ? fr(s.price) + ' FCFA' : 'Gratuit'}</b>
                    </span>
                    <span className="mark" />
                  </button>
                ))}
              </div>
            </section>

            <section className="card section">
              <h2>
                <span className="num">3</span>Paiement
              </h2>
              <div className="choices pays" role="radiogroup" aria-label="Moyen de paiement">
                {PAYS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    className={`choice${pay === p.id ? ' on' : ''}`}
                    aria-checked={pay === p.id}
                    onClick={() => setPay(p.id)}
                  >
                    <span className="c-ic brand" style={{ background: p.color }}>
                      {p.mark}
                    </span>
                    <span className="c-txt">
                      <strong>{p.label}</strong>
                      <small>{p.hint}</small>
                    </span>
                    <span className="mark" />
                  </button>
                ))}
              </div>
              {pay === 'card' ? (
                <div className="card-fields">
                  <div className="form-field">
                    <label className="field-label">Numéro de carte</label>
                    <div className="field-box">
                      <MaterialIcon name="credit_card" />
                      <input
                        name="card"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="4242 4242 4242 4242"
                        value={m.card}
                        onChange={(e) => formatCard(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="row-2">
                    <div className="form-field">
                      <label className="field-label">Expiration</label>
                      <div className="field-box">
                        <input
                          name="exp"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          placeholder="MM / AA"
                          value={m.exp}
                          onChange={(e) => formatExp(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-field">
                      <label className="field-label">Cryptogramme</label>
                      <div className="field-box">
                        <input
                          name="cvc"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          maxLength={4}
                          placeholder="123"
                          value={m.cvc}
                          onChange={(e) => set({ cvc: e.target.value })}
                        />
                        <Tooltip title="3 chiffres au dos de la carte">
                          <span className="hint-ic">
                            <MaterialIcon name="help_outline" />
                          </span>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="form-field">
                  <label className="field-label">Numéro {payLabel}</label>
                  <div className="field-box">
                    <span className="prefix">+225</span>
                    <input name="momo" type="tel" value={m.momo} onChange={(e) => set({ momo: e.target.value })} />
                  </div>
                  <span className="help">
                    Vous recevrez une demande de confirmation sur ce numéro. Gardez votre téléphone à portée de main.
                  </span>
                </div>
              )}
              <FormControlLabel
                control={
                  <Checkbox
                    name="same"
                    checked={m.sameBilling}
                    onChange={(e) => set({ sameBilling: e.target.checked })}
                  />
                }
                label="Adresse de facturation identique"
              />
              <FormControlLabel
                control={<Checkbox name="save" checked={m.save} onChange={(e) => set({ save: e.target.checked })} />}
                label="Enregistrer ces informations pour mes prochaines commandes"
              />
            </section>

            <Button
              variant="contained"
              disableElevation
              type="submit"
              className="pay-btn"
              disabled={state === 'waiting' || !items.length}
            >
              {state === 'waiting' ? <CircularProgress size={18} color="inherit" /> : `Payer ${fr(total)} FCFA`}
            </Button>
            {state === 'waiting' && pay !== 'card' && (
              <div className="waiting card">
                <MaterialIcon name="smartphone" />
                <span>
                  <strong>Confirmez le paiement sur votre téléphone</strong>
                  <small>Saisissez votre code secret dans la fenêtre qui s’affiche (+225 {m.momo}).</small>
                </span>
              </div>
            )}
          </form>

          <aside className={`summary card${summaryOpen ? ' open' : ''}`}>
            <button type="button" className="sum-toggle" onClick={() => setSummaryOpen((o) => !o)}>
              <MaterialIcon name="shopping_bag" />
              {summaryOpen ? 'Masquer' : 'Afficher'} le récapitulatif ({count})<span className="spacer" />
              <strong>{fr(total)} F</strong>
            </button>
            <div className="sum-body">
              <h2>Récapitulatif</h2>
              {items.map((it, i) => (
                <div key={it.name} className="item">
                  <span className="thumb" style={{ '--h': it.hue } as CSSProperties}>
                    <MaterialIcon name={it.icon} />
                  </span>
                  <span className="it-txt">
                    <strong>{it.name}</strong>
                    <small>{it.variant}</small>
                    <NumberStepper compact min={0} max={9} value={it.qty} onChange={(v) => setQty(i, v)} />
                  </span>
                  <span className="it-price">
                    {fr(it.price * it.qty)} F
                    <button type="button" onClick={() => remove(i)} aria-label="Retirer">
                      <MaterialIcon name="delete_outline" />
                    </button>
                  </span>
                </div>
              ))}
              <div className="promo">
                <div className="field-box">
                  <MaterialIcon name="sell" />
                  <input
                    value={promo}
                    onChange={(e) => setPromo(e.target.value)}
                    placeholder="Code promo (AKWABA10)"
                    onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                  />
                </div>
                <Button variant="outlined" color="inherit" onClick={applyPromo}>
                  Appliquer
                </Button>
              </div>
              {promoMsg === 'ok' && (
                <span className="promo-ok">
                  <MaterialIcon name="check_circle" />
                  Code AKWABA10 : −10 %
                </span>
              )}
              {promoMsg === 'ko' && (
                <span className="err">
                  <MaterialIcon name="error" />
                  Code inconnu ou expiré.
                </span>
              )}
              <dl className="totals">
                <dt>Sous-total</dt>
                <dd>{fr(subtotal)} F</dd>
                {discount > 0 && (
                  <>
                    <dt>Remise</dt>
                    <dd className="disc">− {fr(discount)} F</dd>
                  </>
                )}
                <dt>Livraison</dt>
                <dd>{shippingPrice ? fr(shippingPrice) + ' F' : 'Gratuite'}</dd>
                <dt className="tot">Total TTC</dt>
                <dd className="tot">{fr(total)} FCFA</dd>
              </dl>
              <p className="secure">
                <MaterialIcon name="verified_user" />
                Paiement sécurisé · retours gratuits sous 14 jours
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
