import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
} from '@mui/material';
import { useState } from 'react';
import { Result } from '../../../../components/feedback/Result';
import { UploadQueue } from '../../../../components/feedback/UploadQueue';
import { MatSelect } from '../../../../components/forms/MatSelect';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import '../../ex-page.scss';
import '../form-page.scss';
import './contact.scss';

const SUBJECTS = ['Demande de démo', 'Devis', 'Support technique', 'Partenariat', 'Autre'];
const CODES = [
  { code: '+225', flag: '🇨🇮' },
  { code: '+221', flag: '🇸🇳' },
  { code: '+223', flag: '🇲🇱' },
  { code: '+226', flag: '🇧🇫' },
  { code: '+33', flag: '🇫🇷' },
];
const CODE_OPTIONS = CODES.map((c) => ({ value: c.code, label: `${c.flag} ${c.code}` }));
const CHANNELS = [
  { icon: 'call', label: 'Téléphone', value: '+225 27 22 00 00 00', hint: 'Lun – ven, 8 h – 18 h' },
  { icon: 'mail', label: 'E-mail', value: 'contact@scstorage.ci', hint: 'Réponse sous 24 h ouvrées' },
  { icon: 'place', label: 'Bureaux', value: 'Plateau, Abidjan', hint: 'Immeuble Alpha 2000, 12ᵉ étage' },
];
const FAQ = [
  {
    q: 'Proposez-vous un essai gratuit ?',
    a: 'Oui, 30 jours sans carte bancaire, avec toutes les fonctionnalités de l’offre Pro.',
  },
  {
    q: 'Mes données sont-elles hébergées localement ?',
    a: 'Les données sont hébergées à Abidjan et sauvegardées chaque nuit sur un second site.',
  },
  {
    q: 'Puis-je payer par Mobile Money ?',
    a: 'Orange Money, MTN MoMo et Wave sont acceptés, ainsi que la carte et le virement.',
  },
];
const EMPTY = {
  subject: 'Demande de démo',
  name: '',
  email: '',
  company: '',
  cc: '+225',
  phone: '',
  message: '',
  consent: false,
};

/** /examples/forms/contact — coordonnées + FAQ à gauche, formulaire validé à la soumission à droite. */
export function ContactFormPage() {
  const [m, setM] = useState(EMPTY);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const set = (p: Partial<typeof m>) => setM((x) => ({ ...x, ...p }));
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email);

  const submit = () => {
    setTried(true);
    if (!m.name || !emailOk || m.message.length < 20 || !m.consent) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setSent(true);
    }, 900);
  };
  const reset = () => {
    setM((x) => ({ ...x, message: '', consent: false }));
    setTried(false);
    setSent(false);
  };

  return (
    <div className="ex-page ex-form ex-contact">
      <div className="form-head">
        <span className="text-overline">Support & ventes</span>
        <h1>Parlons de votre projet</h1>
        <p>Une question, une démo, un devis ? Notre équipe répond en moins de 24 h ouvrées.</p>
      </div>

      <div className="layout">
        <aside className="info">
          <section className="card channels">
            {CHANNELS.map((c) => (
              <div key={c.label} className="ch">
                <span className="ic">
                  <MaterialIcon name={c.icon} />
                </span>
                <span>
                  <small>{c.label}</small>
                  <strong>{c.value}</strong>
                  <em>{c.hint}</em>
                </span>
              </div>
            ))}
          </section>
          <section className="card faq">
            <h2>Questions fréquentes</h2>
            {FAQ.map((f, i) => (
              <Accordion
                key={f.q}
                disableGutters
                square
                elevation={0}
                className={`mat-expansion-panel${openFaq === i ? ' mat-expanded' : ''}`}
                expanded={openFaq === i}
                onChange={() => setOpenFaq((o) => (o === i ? null : i))}
                slotProps={{ heading: { component: 'div' } }}
              >
                <AccordionSummary
                  expandIcon={<MaterialIcon name="expand_more" />}
                  className="mat-expansion-panel-header"
                >
                  <span className="pt-title">{f.q}</span>
                </AccordionSummary>
                <AccordionDetails className="mat-expansion-panel-body">
                  <p>{f.a}</p>
                </AccordionDetails>
              </Accordion>
            ))}
          </section>
        </aside>

        <section className="card section main">
          {sent ? (
            <Result
              status="success"
              icon="mark_email_read"
              title="Message envoyé"
              actions={
                <Button variant="outlined" color="inherit" onClick={reset}>
                  Envoyer un autre message
                </Button>
              }
            >
              <p className="result-text">
                Merci {m.name.split(' ')[0]} ! Un accusé de réception a été envoyé à <strong>{m.email}</strong>.
                Référence : <code>CT-2026-0418</code>.
              </p>
            </Result>
          ) : (
            <form
              className="fields"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <div className="form-field">
                <label className="field-label">Objet de votre demande</label>
                <div className="chips-choice" role="radiogroup">
                  {SUBJECTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={m.subject === s}
                      className={m.subject === s ? 'on' : ''}
                      onClick={() => set({ subject: s })}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="row-2">
                <div className={`form-field${tried && !m.name ? ' invalid' : ''}`}>
                  <label className="field-label" htmlFor="c-name">
                    Nom complet<span className="req">*</span>
                  </label>
                  <div className="field-box">
                    <MaterialIcon name="person" />
                    <input
                      id="c-name"
                      name="name"
                      value={m.name}
                      onChange={(e) => set({ name: e.target.value })}
                      autoComplete="name"
                      placeholder="Jean Kouassi"
                    />
                  </div>
                  {tried && !m.name && (
                    <span className="err">
                      <MaterialIcon name="error" />
                      Indiquez votre nom.
                    </span>
                  )}
                </div>
                <div className={`form-field${tried && !emailOk ? ' invalid' : ''}`}>
                  <label className="field-label" htmlFor="c-mail">
                    E-mail professionnel<span className="req">*</span>
                  </label>
                  <div className="field-box">
                    <MaterialIcon name="mail" />
                    <input
                      id="c-mail"
                      name="email"
                      type="email"
                      value={m.email}
                      onChange={(e) => set({ email: e.target.value })}
                      autoComplete="email"
                      placeholder="nom@entreprise.ci"
                    />
                  </div>
                  {tried && !emailOk && (
                    <span className="err">
                      <MaterialIcon name="error" />
                      Adresse e-mail invalide.
                    </span>
                  )}
                </div>
              </div>
              <div className="row-2">
                <div className="form-field">
                  <label className="field-label" htmlFor="c-co">
                    Entreprise
                  </label>
                  <div className="field-box">
                    <MaterialIcon name="business" />
                    <input
                      id="c-co"
                      name="company"
                      value={m.company}
                      onChange={(e) => set({ company: e.target.value })}
                      autoComplete="organization"
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label className="field-label" htmlFor="c-tel">
                    Téléphone
                  </label>
                  <div className="field-box phone">
                    <span className="cc">
                      <MatSelect
                        options={CODE_OPTIONS}
                        value={m.cc}
                        onChange={(v) => set({ cc: v as string })}
                        aria-label="Indicatif"
                      />
                    </span>
                    <input
                      id="c-tel"
                      name="tel"
                      type="tel"
                      inputMode="tel"
                      value={m.phone}
                      onChange={(e) => set({ phone: e.target.value })}
                      placeholder="07 07 12 34 56"
                      autoComplete="tel-national"
                    />
                  </div>
                </div>
              </div>
              <div className={`form-field${tried && m.message.length < 20 ? ' invalid' : ''}`}>
                <div className="label-row">
                  <label className="field-label" htmlFor="c-msg">
                    Message<span className="req">*</span>
                  </label>
                  <span className={`help${m.message.length > 900 ? ' warn' : ''}`}>{m.message.length} / 1000</span>
                </div>
                <div className="field-box textarea-box">
                  <textarea
                    id="c-msg"
                    name="message"
                    rows={6}
                    maxLength={1000}
                    value={m.message}
                    onChange={(e) => set({ message: e.target.value })}
                    placeholder="Décrivez votre besoin : contexte, volumes, délais…"
                  />
                </div>
                {tried && m.message.length < 20 && (
                  <span className="err">
                    <MaterialIcon name="error" />
                    Au moins 20 caractères ({20 - m.message.length} restants).
                  </span>
                )}
              </div>
              <div className="form-field">
                <label className="field-label">
                  Pièces jointes <span className="help">(facultatif)</span>
                </label>
                <UploadQueue
                  accept=".pdf,image/*,.xlsx,.csv"
                  maxSize={10 * 1024 * 1024}
                  maxFiles={3}
                  hint="PDF, image ou tableur · 10 Mo max. · 3 fichiers"
                />
              </div>
              <FormControlLabel
                control={
                  <Checkbox name="consent" checked={m.consent} onChange={(e) => set({ consent: e.target.checked })} />
                }
                label={
                  <>
                    J’accepte que mes données soient utilisées pour traiter ma demande.<span className="req">*</span>
                  </>
                }
              />
              {tried && !m.consent && (
                <span className="err">
                  <MaterialIcon name="error" />
                  Votre accord est nécessaire.
                </span>
              )}
              <div className="actions-bar">
                <span className="help">
                  <MaterialIcon name="lock" className="lock" />
                  Vos données restent en Côte d’Ivoire.
                </span>
                <span className="spacer" />
                <Button variant="contained" disableElevation type="submit" disabled={busy}>
                  {busy ? <CircularProgress size={18} color="inherit" /> : 'Envoyer le message'}
                </Button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
