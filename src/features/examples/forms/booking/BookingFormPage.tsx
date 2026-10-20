import { Button } from '@mui/material';
import { useState } from 'react';
import { Result } from '../../../../components/feedback/Result';
import { NumberStepper } from '../../../../components/fields/NumberStepper';
import { Calendar } from '../../../../components/forms/Calendar';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import '../../ex-page.scss';
import '../form-page.scss';
import './booking.scss';

const SERVICES = [
  { id: 'form', label: 'Formation utilisateurs', duration: '3 h', price: 25000, icon: 'school' },
  { id: 'demo', label: 'Démonstration produit', duration: '1 h', price: 0, icon: 'co_present' },
  { id: 'atelier', label: 'Atelier paramétrage', duration: '2 h', price: 40000, icon: 'build' },
];
const PERIODS = [
  { label: 'Matin', icon: 'wb_twilight', slots: ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00'] },
  { label: 'Après-midi', icon: 'wb_sunny', slots: ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
];
const NEEDS = ['Projecteur', 'Accès PMR', 'Pause café', 'Interprète', 'Ordinateurs fournis'];
const TODAY = new Date(2026, 9, 17);
/** Fermé le week-end. */
const isOpen = (d: Date) => d.getDay() !== 0 && d.getDay() !== 6;
const fr = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
const dayMonth = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const dayMonthYear = (d: Date) =>
  d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/** /examples/forms/booking — réservation : prestation, calendrier, créneaux, participants, récapitulatif. */
export function BookingFormPage() {
  const [serviceId, setServiceId] = useState('form');
  const [date, setDate] = useState(new Date(2026, 9, 21));
  const [slot, setSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [people, setPeople] = useState(4);
  const [contact, setContact] = useState('Jean Kouassi');
  const [picked, setPicked] = useState(new Set<string>(['Pause café']));

  const service = SERVICES.find((s) => s.id === serviceId) ?? SERVICES[0];
  const price = service?.price ?? 0;
  const total = price * people;
  /** Créneaux complets pseudo-aléatoires (stables pour une date donnée). */
  const isFull = (t: string) => (date.getDate() * 7 + parseInt(t, 10) + +t.slice(3)) % 5 === 0;
  const pickDate = (d: Date) => {
    setDate(d);
    setSlot(null);
  };
  const toggleNeed = (n: string) =>
    setPicked((p) => {
      const s = new Set(p);
      if (s.has(n)) s.delete(n);
      else s.add(n);
      return s;
    });

  return (
    <div className="ex-page ex-form ex-booking">
      <div className="form-head">
        <span className="text-overline">Salle de formation · Plateau</span>
        <h1>Réserver une session</h1>
        <p>Choisissez une prestation, une date et un créneau. La confirmation est immédiate.</p>
      </div>

      {confirmed ? (
        <section className="card done">
          <Result
            status="success"
            icon="event_available"
            title="Réservation confirmée"
            actions={
              <>
                <Button variant="outlined" color="inherit" startIcon={<MaterialIcon name="calendar_add_on" />}>
                  Ajouter à l’agenda
                </Button>
                <Button variant="contained" disableElevation onClick={() => setConfirmed(false)}>
                  Nouvelle réservation
                </Button>
              </>
            }
          >
            <p className="result-text">
              {service?.label} le <strong>{dayMonth(date)}</strong> à <strong>{slot}</strong> pour {people} personne(s).
              Une invitation calendrier a été envoyée.
            </p>
          </Result>
        </section>
      ) : (
        <div className="layout">
          <div className="main">
            <section className="card section">
              <h2>
                <span className="num">1</span>Prestation
              </h2>
              <div className="choices">
                {SERVICES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`choice${serviceId === s.id ? ' on' : ''}`}
                    onClick={() => setServiceId(s.id)}
                  >
                    <span className="c-ic">
                      <MaterialIcon name={s.icon} />
                    </span>
                    <span className="c-txt">
                      <strong>{s.label}</strong>
                      <small>
                        {s.duration} · {s.price ? fr(s.price) + ' F / pers.' : 'Gratuit'}
                      </small>
                    </span>
                    <span className="mark" />
                  </button>
                ))}
              </div>
            </section>

            <section className="card section">
              <h2>
                <span className="num">2</span>Date et heure
              </h2>
              <div className="when">
                <div className="cal">
                  <Calendar selected={date} onSelect={pickDate} min={TODAY} dateFilter={isOpen} />
                </div>
                <div className="slots">
                  <strong className="cap">{dayMonth(date)}</strong>
                  {PERIODS.map((p) => (
                    <div key={p.label} className="period-block">
                      <span className="period">
                        <MaterialIcon name={p.icon} />
                        {p.label}
                      </span>
                      <div className="slot-grid">
                        {p.slots.map((t) => (
                          <button
                            key={t}
                            type="button"
                            className={slot === t ? 'on' : ''}
                            disabled={isFull(t)}
                            onClick={() => setSlot(t)}
                          >
                            {t}
                            {isFull(t) && <small>Complet</small>}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="card section">
              <h2>
                <span className="num">3</span>Participants
              </h2>
              <div className="row-2">
                <div className="form-field">
                  <label className="field-label">Nombre de personnes</label>
                  <NumberStepper value={people} onChange={setPeople} min={1} max={12} unit="pers." />
                  <span className="help">12 places maximum par session.</span>
                </div>
                <div className="form-field">
                  <label className="field-label">Responsable</label>
                  <div className="field-box">
                    <MaterialIcon name="person" />
                    <input value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="name" />
                  </div>
                </div>
              </div>
              <div className="form-field">
                <label className="field-label">
                  Besoins particuliers <span className="help">(facultatif)</span>
                </label>
                <div className="chips-choice">
                  {NEEDS.map((n) => (
                    <button key={n} type="button" className={picked.has(n) ? 'on' : ''} onClick={() => toggleNeed(n)}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <aside className="card summary">
            <h2>Votre réservation</h2>
            <div className="sum-line">
              <MaterialIcon name={service?.icon ?? 'event'} />
              <span>
                <strong>{service?.label}</strong>
                <small>{service?.duration}</small>
              </span>
            </div>
            <div className="sum-line">
              <MaterialIcon name="event" />
              <span>
                <strong className="cap">{dayMonthYear(date)}</strong>
                <small>{slot ?? 'Choisissez un créneau'}</small>
              </span>
            </div>
            <div className="sum-line">
              <MaterialIcon name="group" />
              <span>
                <strong>{people} participant(s)</strong>
                <small>{contact}</small>
              </span>
            </div>
            <dl>
              <dt>
                {fr(price)} F × {people}
              </dt>
              <dd>{fr(total)} F</dd>
              <dt className="tot">Total</dt>
              <dd className="tot">{fr(total)} FCFA</dd>
            </dl>
            <Button
              variant="contained"
              disableElevation
              className="go"
              disabled={!slot}
              onClick={() => setConfirmed(true)}
            >
              Confirmer la réservation
            </Button>
            <p className="help center">
              <MaterialIcon name="info" />
              Annulation gratuite jusqu’à 24 h avant.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
