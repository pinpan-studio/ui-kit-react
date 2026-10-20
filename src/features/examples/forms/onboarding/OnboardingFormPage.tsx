import { Button } from '@mui/material';
import { useState } from 'react';
import { Link } from 'react-router';
import { Result } from '../../../../components/feedback/Result';
import { ColorPicker } from '../../../../components/fields/ColorPicker';
import { TagInput } from '../../../../components/fields/TagInput';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import { EX_MODULES } from '../../../../data/static/examples.data';
import '../../ex-page.scss';
import '../form-page.scss';
import './onboarding.scss';

const STEPS = [
  { label: 'Votre profil', hint: 'Nom, rôle, photo', icon: 'person' },
  { label: 'Votre organisation', hint: 'Secteur et taille', icon: 'business' },
  { label: 'Vos modules', hint: 'Ce que vous allez utiliser', icon: 'apps' },
  { label: 'Votre équipe', hint: 'Invitez vos collègues', icon: 'group_add' },
];
const ROLES = ['Direction', 'Opérations', 'Finance', 'Commercial', 'Technique', 'Autre'];
const SECTORS = [
  { id: 'transport', label: 'Transport & logistique', icon: 'local_shipping' },
  { id: 'agro', label: 'Agro-industrie', icon: 'agriculture' },
  { id: 'retail', label: 'Commerce & distribution', icon: 'storefront' },
  { id: 'services', label: 'Services', icon: 'handshake' },
  { id: 'health', label: 'Santé', icon: 'local_hospital' },
  { id: 'other', label: 'Autre', icon: 'more_horiz' },
];
const SIZES = ['1 – 10', '11 – 50', '51 – 200', '201 – 1 000', '1 000 +'];
const MODULES = EX_MODULES.slice(0, 8);
const SUGGESTIONS = ['aya.kone@sotra.ci', 'marc.yao@exemple.ci', 'grace@digitalbaobab.ci'];
const SWATCHES = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#334155'];
const INVITE_ROLES = ['Administrateur', 'Membre', 'Lecture seule'];
const emailValidator = (t: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);

/** /examples/forms/onboarding — assistant plein écran : étapes verticales à gauche, une intention par écran à droite. */
export function OnboardingFormPage() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [m, setM] = useState({
    first: 'Jean',
    last: 'Kouassi',
    role: 'Direction',
    color: '#0ea5e9',
    company: '',
    sector: 'transport',
    size: '11 – 50',
    modules: new Set<string>(['crm', 'billing']),
    invites: [] as string[],
    inviteRole: 'Membre',
  });
  const set = (p: Partial<typeof m>) => setM((x) => ({ ...x, ...p }));
  const progress = ((step + (done ? 1 : 0)) / STEPS.length) * 100;
  const initials = ((m.first[0] ?? '') + (m.last[0] ?? '')).toUpperCase() || '?';

  const toggleModule = (id: string) => {
    const s = new Set(m.modules);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    set({ modules: s });
  };
  const next = () => {
    const checks = [
      () => (!m.first || !m.last ? 'Indiquez votre prénom et votre nom.' : ''),
      () => (!m.company ? 'Indiquez le nom de votre organisation.' : ''),
      () => (!m.modules.size ? 'Choisissez au moins un module.' : ''),
      () => '',
    ];
    const err = checks[step]?.() ?? '';
    setError(err);
    if (err) return;
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else setDone(true);
  };
  const back = () => {
    setError('');
    setStep((s) => Math.max(0, s - 1));
  };
  const goTo = (i: number) => {
    if (i < step) {
      setError('');
      setStep(i);
    }
  };
  const restart = () => {
    setDone(false);
    setStep(0);
  };

  return (
    <div className="ex-page ex-form ex-onboarding">
      <div className="wizard">
        <aside className="rail">
          <Link className="brand" to="/examples/app/modules">
            <img src="/assets/logo-white.png" alt="" />
            <span>SC Storage</span>
          </Link>
          <div className="intro">
            <h2>Configurons votre espace</h2>
            <p>Quatre étapes, environ deux minutes. Vous pourrez tout modifier plus tard.</p>
          </div>
          <ol className="vsteps">
            {STEPS.map((s, i) => (
              <li key={s.label} className={`${i === step && !done ? 'on' : ''}${i < step || done ? ' done' : ''}`}>
                <button type="button" onClick={() => goTo(i)} disabled={i >= step}>
                  <span className="dot">
                    <MaterialIcon name={i < step || done ? 'check' : s.icon} />
                  </span>
                  <span className="txt">
                    <strong>{s.label}</strong>
                    <small>{s.hint}</small>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <p className="help-line">
            <MaterialIcon name="support_agent" />
            Besoin d’aide ?{' '}
            <a href="#" onClick={(e) => e.preventDefault()}>
              Parler à un conseiller
            </a>
          </p>
        </aside>

        <main className="stage">
          <div className="mobile-progress">
            <span style={{ width: progress + '%' }} />
          </div>
          <div className="top">
            <span className="count">
              Étape {done ? STEPS.length : step + 1} sur {STEPS.length}
            </span>
            <Link to="/examples/app/modules" className="skip">
              Passer pour l’instant
            </Link>
          </div>

          <div className="pane">
            {done ? (
              <Result
                status="success"
                icon="celebration"
                title={`Bienvenue ${m.first} !`}
                actions={
                  <>
                    <Button variant="outlined" color="inherit" onClick={restart}>
                      Recommencer
                    </Button>
                    <Button variant="contained" disableElevation component={Link} to="/examples/app/dashboard">
                      Accéder au tableau de bord
                    </Button>
                  </>
                }
              >
                <p className="result-text">
                  L’espace <strong>{m.company}</strong> est prêt avec {m.modules.size} module(s).
                  {m.invites.length > 0 && ` ${m.invites.length} invitation(s) envoyée(s).`}
                </p>
              </Result>
            ) : (
              <>
                {step === 0 && (
                  <>
                    <h1>Faisons connaissance</h1>
                    <p className="lead">Ces informations apparaissent sur vos commentaires, factures et messages.</p>
                    <div className="profile">
                      <span className="avatar" style={{ background: m.color }}>
                        {initials}
                      </span>
                      <div className="form-field">
                        <label className="field-label">Couleur de l’avatar</label>
                        <ColorPicker value={m.color} onChange={(color) => set({ color })} swatches={SWATCHES} />
                      </div>
                    </div>
                    <div className="row-2">
                      <div className="form-field">
                        <label className="field-label">Prénom</label>
                        <div className="field-box">
                          <input
                            value={m.first}
                            onChange={(e) => set({ first: e.target.value })}
                            autoComplete="given-name"
                          />
                        </div>
                      </div>
                      <div className="form-field">
                        <label className="field-label">Nom</label>
                        <div className="field-box">
                          <input
                            value={m.last}
                            onChange={(e) => set({ last: e.target.value })}
                            autoComplete="family-name"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="form-field">
                      <label className="field-label">Votre rôle</label>
                      <div className="chips-choice">
                        {ROLES.map((r) => (
                          <button
                            key={r}
                            type="button"
                            className={m.role === r ? 'on' : ''}
                            onClick={() => set({ role: r })}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {step === 1 && (
                  <>
                    <h1>Votre organisation</h1>
                    <p className="lead">
                      Nous adaptons les modèles de factures, les rapports et le vocabulaire à votre activité.
                    </p>
                    <div className="form-field">
                      <label className="field-label">Nom de l’organisation</label>
                      <div className="field-box big">
                        <MaterialIcon name="business" />
                        <input
                          value={m.company}
                          onChange={(e) => set({ company: e.target.value })}
                          placeholder="Ex : Sotra Logistique"
                          autoComplete="organization"
                        />
                      </div>
                    </div>
                    <div className="form-field">
                      <label className="field-label">Secteur d’activité</label>
                      <div className="choices">
                        {SECTORS.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className={`choice${m.sector === s.id ? ' on' : ''}`}
                            onClick={() => set({ sector: s.id })}
                          >
                            <span className="c-ic">
                              <MaterialIcon name={s.icon} />
                            </span>
                            <span className="c-txt">
                              <strong>{s.label}</strong>
                            </span>
                            <span className="mark" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="form-field">
                      <label className="field-label">Nombre d’employés</label>
                      <div className="seg">
                        {SIZES.map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={m.size === s ? 'on' : ''}
                            onClick={() => set({ size: s })}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {step === 2 && (
                  <>
                    <h1>Que voulez-vous gérer ?</h1>
                    <p className="lead">
                      Choisissez vos modules de départ. Les autres restent disponibles à tout moment.
                    </p>
                    <div className="choices mods">
                      {MODULES.map((mod) => (
                        <button
                          key={mod.id}
                          type="button"
                          className={`choice square${m.modules.has(mod.id) ? ' on' : ''}`}
                          aria-pressed={m.modules.has(mod.id)}
                          onClick={() => toggleModule(mod.id)}
                        >
                          <span className="c-ic" style={{ color: m.modules.has(mod.id) ? undefined : mod.color }}>
                            <MaterialIcon name={mod.icon} />
                          </span>
                          <span className="c-txt">
                            <strong>{mod.label}</strong>
                            <small>{mod.description}</small>
                          </span>
                          <span className="mark" />
                        </button>
                      ))}
                    </div>
                    <p className="help">{m.modules.size} module(s) sélectionné(s) · inclus dans l’essai gratuit</p>
                  </>
                )}
                {step === 3 && (
                  <>
                    <h1>Invitez votre équipe</h1>
                    <p className="lead">
                      Ajoutez des adresses e-mail séparées par une virgule ou Entrée. Vous pouvez aussi le faire plus
                      tard.
                    </p>
                    <div className="form-field">
                      <label className="field-label">Adresses e-mail</label>
                      <TagInput
                        value={m.invites}
                        onChange={(invites) => set({ invites })}
                        suggestions={SUGGESTIONS}
                        validator={emailValidator}
                        invalidMessage="Adresse e-mail invalide"
                        placeholder="collegue@entreprise.ci"
                        icon="alternate_email"
                      />
                    </div>
                    <div className="form-field">
                      <label className="field-label">Rôle attribué</label>
                      <div className="seg">
                        {INVITE_ROLES.map((r) => (
                          <button
                            key={r}
                            type="button"
                            className={m.inviteRole === r ? 'on' : ''}
                            onClick={() => set({ inviteRole: r })}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="share card">
                      <MaterialIcon name="link" />
                      <span>
                        <strong>Ou partagez un lien d’invitation</strong>
                        <small>scstorage.ci/rejoindre/7Hk2-pQ</small>
                      </span>
                      <Button variant="outlined" color="inherit">
                        Copier
                      </Button>
                    </div>
                  </>
                )}
                {error && (
                  <p className="err" role="alert">
                    <MaterialIcon name="error" />
                    {error}
                  </p>
                )}
                <div className="actions-bar nav">
                  {step > 0 && (
                    <Button onClick={back} startIcon={<MaterialIcon name="arrow_back" />}>
                      Retour
                    </Button>
                  )}
                  <span className="spacer" />
                  <Button
                    variant="contained"
                    disableElevation
                    onClick={next}
                    endIcon={<MaterialIcon name="arrow_forward" />}
                  >
                    {step === STEPS.length - 1 ? (m.invites.length ? 'Envoyer et terminer' : 'Terminer') : 'Continuer'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
