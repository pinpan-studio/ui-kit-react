import { Button, Checkbox, CircularProgress, FormControlLabel, IconButton, Tooltip } from '@mui/material';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { OtpInput } from '../../../components/fields/OtpInput';
import { PasswordField } from '../../../components/fields/PasswordField';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import { CURRENT_USER } from '../../../lib/session';
import { ProviderIcon } from './ProviderIcon';
import { PROVIDERS, type AuthProvider } from './providers';
import '../ex-page.scss';
import './auth.scss';

/** Disposition de la page : où se trouve le formulaire et ce qui l'entoure. */
type AuthLayout = 'centered' | 'split-right' | 'split-left' | 'image' | 'minimal';
/** Contenu du formulaire. */
type AuthScreen = 'login' | 'register' | 'forgot' | 'otp' | 'lock' | 'social' | 'accounts';
/**
 * Présentation des connexions sociales : grille de boutons, pile pleine largeur,
 * rangée d'icônes rondes, ou boutons aux couleurs des marques. `top` : avant le formulaire e-mail.
 */
interface SsoConfig {
  style: 'grid' | 'stack' | 'icons' | 'brand';
  providers: AuthProvider[];
  top?: boolean;
  verb?: string;
}

const VARIANTS: Record<string, { layout: AuthLayout; screen: AuthScreen; sso?: SsoConfig }> = {
  centered: {
    layout: 'centered',
    screen: 'login',
    sso: { style: 'icons', providers: ['google', 'apple', 'microsoft', 'facebook', 'github', 'linkedin'] },
  },
  'split-right': { layout: 'split-right', screen: 'login', sso: { style: 'grid', providers: ['google', 'microsoft'] } },
  'split-left': {
    layout: 'split-left',
    screen: 'login',
    sso: { style: 'stack', providers: ['google', 'apple', 'microsoft'], top: true, verb: 'Continuer avec' },
  },
  image: {
    layout: 'image',
    screen: 'login',
    sso: { style: 'brand', providers: ['google', 'apple'], verb: 'Continuer avec' },
  },
  minimal: {
    layout: 'minimal',
    screen: 'login',
    sso: { style: 'stack', providers: ['google', 'microsoft', 'github'], top: true, verb: 'Se connecter avec' },
  },
  register: {
    layout: 'split-right',
    screen: 'register',
    sso: { style: 'grid', providers: ['google', 'linkedin'], top: true },
  },
  social: {
    layout: 'centered',
    screen: 'social',
    sso: {
      style: 'brand',
      providers: ['google', 'apple', 'microsoft', 'facebook', 'github', 'linkedin'],
      verb: 'Continuer avec',
    },
  },
  accounts: { layout: 'minimal', screen: 'accounts' },
  forgot: { layout: 'centered', screen: 'forgot' },
  otp: { layout: 'centered', screen: 'otp' },
  lock: { layout: 'image', screen: 'lock' },
};
/** Comptes proposés par le sélecteur de compte (écran « accounts »). */
const ACCOUNTS = [
  { name: CURRENT_USER.fullname, mail: 'jean.kouassi@gmail.com', color: '#0ea5e9', work: false },
  { name: 'Jean Kouassi', mail: 'j.kouassi@scstorage.ci', color: '#8b5cf6', work: true },
];
const STEPS = ['Compte', 'Sécurité', 'Organisation'];
const SIZES = ['1-10', '11-50', '51-200', '200+'];
const INITIALS = CURRENT_USER.fullname
  .split(' ')
  .map((n) => n[0] ?? '')
  .join('');
const YEAR = new Date().getFullYear();

const Spinner = () => <CircularProgress size={18} color="inherit" />;

function Brand({ light, compact }: { light?: boolean; compact?: boolean }) {
  return (
    <div className={`brand${light ? ' light' : ''}${compact ? ' compact' : ''}`}>
      <img src={light ? '/assets/logo-white.png' : '/assets/logo.png'} alt="" />
      <span>SC Storage</span>
    </div>
  );
}
function Legal() {
  return (
    <footer className="legal">
      © {YEAR} SC Storage ·{' '}
      <a href="#" onClick={(e) => e.preventDefault()}>
        Confidentialité
      </a>{' '}
      ·{' '}
      <a href="#" onClick={(e) => e.preventDefault()}>
        Conditions
      </a>
    </footer>
  );
}

/**
 * /examples/auth/:variant — écrans d'authentification d'exemple (aucune authentification réelle).
 * Une même page combine une disposition (carte centrée, split, image, minimale) et un écran
 * (connexion, inscription, oubli, code, verrouillage).
 */
export function AuthPage() {
  const { variant = 'centered' } = useParams();
  const config = VARIANTS[variant] ?? (VARIANTS['centered'] as (typeof VARIANTS)[string]);
  const { layout, screen, sso } = config;

  /** Fournisseur en cours de connexion (spinner dans son bouton), puis fournisseur utilisé. */
  const [ssoBusy, setSsoBusy] = useState<AuthProvider | null>(null);
  const [ssoUsed, setSsoUsed] = useState<AuthProvider | null>(null);
  // Connexion
  const [email, setEmail] = useState('jean.kouassi@example.com');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  // Inscription
  const [step, setStep] = useState(0);
  const [reg, setReg] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    company: '',
    size: '11-50',
    terms: false,
  });
  // Code de vérification
  const [code, setCode] = useState('');
  const [otpState, setOtpState] = useState<'idle' | 'error' | 'success'>('idle');
  const [resendIn, setResendIn] = useState(30);

  useEffect(() => {
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    document.title = 'Connexion · UI Kit';
  }, []);

  /** Simule un appel : 900 ms de chargement puis succès (ou l'erreur fournie). */
  const submit = (err = '') => {
    setError('');
    if (err) {
      setError(err);
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setDone(true);
    }, 900);
  };
  const login = () =>
    submit(
      !email.includes('@')
        ? 'Adresse e-mail invalide.'
        : password.length < 4
          ? 'Mot de passe incorrect. Essayez « demo ».'
          : '',
    );
  const unlock = () => submit(password.length < 4 ? 'Mot de passe incorrect.' : '');
  const forgot = () => submit(!email.includes('@') ? 'Saisissez l’adresse e-mail de votre compte.' : '');
  const nextStep = () => {
    const r = reg;
    const errs = [
      () =>
        !r.firstName || !r.lastName
          ? 'Indiquez votre prénom et votre nom.'
          : !r.email.includes('@')
            ? 'Adresse e-mail invalide.'
            : '',
      () => (r.password.length < 8 ? 'Le mot de passe doit contenir au moins 8 caractères.' : ''),
      () =>
        !r.company
          ? 'Indiquez le nom de votre organisation.'
          : !r.terms
            ? 'Acceptez les conditions pour continuer.'
            : '',
    ];
    const err = errs[step]?.() ?? '';
    setError(err);
    if (err) return;
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else submit();
  };
  const verify = (value = code) => {
    if (value.length < 6) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      const ok = value === '123456';
      setOtpState(ok ? 'success' : 'error');
      if (ok) setTimeout(() => setDone(true), 500);
    }, 700);
  };
  const resend = () => {
    setResendIn(30);
    setOtpState('idle');
    setCode('');
  };
  /** Simule l'aller-retour OAuth du fournisseur. */
  const social = (p: AuthProvider) => {
    if (ssoBusy) return;
    setSsoBusy(p);
    setTimeout(() => {
      setSsoBusy(null);
      setSsoUsed(p);
      setDone(true);
    }, 1100);
  };
  const pickAccount = (mail: string) => {
    setEmail(mail);
    social('google');
  };
  const reset = () => {
    setSsoUsed(null);
    setDone(false);
    setError('');
    setStep(0);
    setPassword('');
    setOtpState('idle');
    setCode('');
  };

  const errorLine = error && (
    <p className="error" role="alert">
      <MaterialIcon name="error" />
      {error}
    </p>
  );

  const ssoBlock = (verbOverride?: string) => {
    if (!sso) return null;
    const verb = verbOverride ?? sso.verb;
    return (
      <div className={`sso sso--${sso.style} n-${sso.providers.length}`}>
        {sso.providers.map((p) => {
          if (sso.style === 'icons')
            return (
              <Tooltip key={p} title={PROVIDERS[p].label}>
                <button
                  type="button"
                  className={`sso-ic p-${p}`}
                  onClick={() => social(p)}
                  aria-label={'Continuer avec ' + PROVIDERS[p].label}
                >
                  {ssoBusy === p ? <Spinner /> : <ProviderIcon provider={p} />}
                </button>
              </Tooltip>
            );
          if (sso.style === 'brand')
            return (
              <button key={p} type="button" className={`sso-brand p-${p}`} onClick={() => social(p)}>
                {ssoBusy === p ? <Spinner /> : <ProviderIcon provider={p} mono={p !== 'google' && p !== 'microsoft'} />}
                <span>
                  {verb ? verb + ' ' : ''}
                  {PROVIDERS[p].label}
                </span>
              </button>
            );
          return (
            <Button
              key={p}
              variant="outlined"
              color="inherit"
              type="button"
              className={`sso-btn p-${p}`}
              onClick={() => social(p)}
            >
              {ssoBusy === p ? <Spinner /> : <ProviderIcon provider={p} />}
              <span>
                {verb ? verb + ' ' : ''}
                {PROVIDERS[p].label}
              </span>
            </Button>
          );
        })}
      </div>
    );
  };

  const pwdToggle = (
    <IconButton
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      aria-label={showPassword ? 'Masquer' : 'Afficher'}
    >
      <MaterialIcon name={showPassword ? 'visibility_off' : 'visibility'} />
    </IconButton>
  );

  let content: ReactNode;
  if (done) {
    content = (
      <div className="success">
        <span className="ok">
          <MaterialIcon name={screen === 'forgot' ? 'mark_email_read' : 'check'} />
        </span>
        {screen === 'forgot' ? (
          <>
            <h1>Vérifiez votre boîte mail</h1>
            <p>
              Un lien de réinitialisation a été envoyé à <strong>{email}</strong>. Il expire dans 30 minutes.
            </p>
          </>
        ) : screen === 'register' ? (
          <>
            <h1>Compte créé</h1>
            <p>
              Bienvenue {reg.firstName} ! Un e-mail de confirmation a été envoyé à <strong>{reg.email}</strong>.
            </p>
          </>
        ) : (
          <>
            <h1>Connexion réussie</h1>
            {ssoUsed && (
              <p className="via">
                <ProviderIcon provider={ssoUsed} /> Connecté avec {PROVIDERS[ssoUsed].label}
                {screen === 'accounts' && ` · ${email}`}
              </p>
            )}
            <p>Redirection vers votre espace… (démonstration statique, aucune session n’est ouverte).</p>
          </>
        )}
        <Button
          variant="contained"
          disableElevation
          className="submit"
          onClick={reset}
          startIcon={<MaterialIcon name="replay" />}
        >
          Recommencer la démo
        </Button>
      </div>
    );
  } else if (screen === 'login') {
    content = (
      <>
        <div className="head">
          <h1>{layout === 'minimal' ? 'Connexion' : 'Bon retour !'}</h1>
          <p>Connectez-vous pour accéder à votre espace.</p>
        </div>
        {sso?.top && (
          <>
            {ssoBlock()}
            <div className="divider">
              <span>ou avec votre e-mail</span>
            </div>
          </>
        )}
        <form
          className="fields"
          onSubmit={(e) => {
            e.preventDefault();
            login();
          }}
        >
          <div className="form-field">
            <label className="field-label" htmlFor="email">
              Adresse e-mail
            </label>
            <div className="field-box">
              <MaterialIcon name="mail" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@entreprise.ci"
              />
            </div>
          </div>
          <div className="form-field">
            <div className="label-row">
              <label className="field-label" htmlFor="pwd">
                Mot de passe
              </label>
              <Link to="/examples/auth/forgot" className="link small">
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="field-box">
              <MaterialIcon name="lock" />
              <input
                id="pwd"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Essayez « demo »"
              />
              {pwdToggle}
            </div>
          </div>
          <FormControlLabel
            control={<Checkbox name="remember" checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
            label="Rester connecté"
          />
          {errorLine}
          <Button variant="contained" disableElevation className="submit" type="submit" disabled={busy}>
            {busy ? <Spinner /> : 'Se connecter'}
          </Button>
        </form>
        {sso && !sso.top && (
          <>
            <div className="divider">
              <span>{sso.style === 'icons' ? 'ou continuer avec' : 'ou'}</span>
            </div>
            {ssoBlock()}
          </>
        )}
        <p className="alt">
          Pas encore de compte ?{' '}
          <Link to="/examples/auth/register" className="link">
            Créer un compte
          </Link>
        </p>
      </>
    );
  } else if (screen === 'register') {
    content = (
      <>
        <div className="head">
          <h1>Créer votre compte</h1>
          <p>Essai gratuit de 30 jours, sans carte bancaire.</p>
        </div>
        {step === 0 && sso && (
          <>
            {ssoBlock('S’inscrire avec')}
            <div className="divider">
              <span>ou avec votre e-mail</span>
            </div>
          </>
        )}
        <ol className="stepper">
          {STEPS.map((s, i) => (
            <li key={s} className={`${i === step ? 'on' : ''}${i < step ? ' done' : ''}`}>
              <span className="dot">{i < step ? <MaterialIcon name="check" /> : i + 1}</span>
              <span className="lbl">{s}</span>
            </li>
          ))}
        </ol>
        <form
          className="fields"
          onSubmit={(e) => {
            e.preventDefault();
            nextStep();
          }}
        >
          {step === 0 && (
            <>
              <div className="row-2">
                <div className="form-field">
                  <label className="field-label">Prénom</label>
                  <div className="field-box">
                    <input
                      name="fn"
                      value={reg.firstName}
                      onChange={(e) => setReg((r) => ({ ...r, firstName: e.target.value }))}
                      placeholder="Jean"
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label className="field-label">Nom</label>
                  <div className="field-box">
                    <input
                      name="ln"
                      value={reg.lastName}
                      onChange={(e) => setReg((r) => ({ ...r, lastName: e.target.value }))}
                      placeholder="Kouassi"
                    />
                  </div>
                </div>
              </div>
              <div className="form-field">
                <label className="field-label">E-mail professionnel</label>
                <div className="field-box">
                  <MaterialIcon name="mail" />
                  <input
                    name="em"
                    type="email"
                    value={reg.email}
                    onChange={(e) => setReg((r) => ({ ...r, email: e.target.value }))}
                    placeholder="nom@entreprise.ci"
                  />
                </div>
              </div>
            </>
          )}
          {step === 1 && (
            <div className="form-field">
              <label className="field-label">Mot de passe</label>
              <PasswordField
                value={reg.password}
                onChange={(v) => setReg((r) => ({ ...r, password: v }))}
                generator
                showRulesEmpty
              />
            </div>
          )}
          {step === 2 && (
            <>
              <div className="form-field">
                <label className="field-label">Organisation</label>
                <div className="field-box">
                  <MaterialIcon name="business" />
                  <input
                    name="co"
                    value={reg.company}
                    onChange={(e) => setReg((r) => ({ ...r, company: e.target.value }))}
                    placeholder="Ex : Sotra Logistique"
                  />
                </div>
              </div>
              <div className="form-field">
                <label className="field-label">Taille de l’équipe</label>
                <div className="sizes">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={reg.size === s ? 'on' : ''}
                      onClick={() => setReg((r) => ({ ...r, size: s }))}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <FormControlLabel
                control={
                  <Checkbox
                    name="terms"
                    checked={reg.terms}
                    onChange={(e) => setReg((r) => ({ ...r, terms: e.target.checked }))}
                  />
                }
                label={
                  <>
                    J’accepte les{' '}
                    <a href="#" className="link" onClick={(e) => e.preventDefault()}>
                      conditions d’utilisation
                    </a>
                  </>
                }
              />
            </>
          )}
          {errorLine}
          <div className="actions">
            {step > 0 && (
              <Button
                variant="outlined"
                color="inherit"
                type="button"
                onClick={() => {
                  setStep((s) => s - 1);
                  setError('');
                }}
              >
                Retour
              </Button>
            )}
            <Button variant="contained" disableElevation className="submit grow" type="submit" disabled={busy}>
              {busy ? <Spinner /> : step < STEPS.length - 1 ? 'Continuer' : 'Créer mon compte'}
            </Button>
          </div>
        </form>
        <p className="alt">
          Déjà inscrit ?{' '}
          <Link to="/examples/auth/split-right" className="link">
            Se connecter
          </Link>
        </p>
      </>
    );
  } else if (screen === 'forgot') {
    content = (
      <>
        <span className="hero-icon">
          <MaterialIcon name="key" />
        </span>
        <div className="head center">
          <h1>Mot de passe oublié ?</h1>
          <p>Saisissez votre adresse e-mail, nous vous enverrons un lien pour en choisir un nouveau.</p>
        </div>
        <form
          className="fields"
          onSubmit={(e) => {
            e.preventDefault();
            forgot();
          }}
        >
          <div className="form-field">
            <label className="field-label">Adresse e-mail</label>
            <div className="field-box">
              <MaterialIcon name="mail" />
              <input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          {errorLine}
          <Button variant="contained" disableElevation className="submit" type="submit" disabled={busy}>
            {busy ? <Spinner /> : 'Envoyer le lien'}
          </Button>
        </form>
        <Link to="/examples/auth/centered" className="back-link">
          <MaterialIcon name="arrow_back" />
          Retour à la connexion
        </Link>
      </>
    );
  } else if (screen === 'otp') {
    content = (
      <>
        <span className="hero-icon">
          <MaterialIcon name="sms" />
        </span>
        <div className="head center">
          <h1>Vérification en deux étapes</h1>
          <p>
            Saisissez le code à 6 chiffres envoyé au <strong>+225 07 •• •• 56</strong>. (Code de démo : 123456)
          </p>
        </div>
        <div className="otp-wrap">
          <OtpInput
            length={6}
            value={code}
            onChange={setCode}
            onCompleted={verify}
            invalid={otpState === 'error'}
            success={otpState === 'success'}
          />
        </div>
        {otpState === 'error' && (
          <p className="error center">
            <MaterialIcon name="error" />
            Code incorrect, réessayez.
          </p>
        )}
        <Button
          variant="contained"
          disableElevation
          className="submit"
          onClick={() => verify()}
          disabled={busy || code.length < 6}
        >
          {busy ? <Spinner /> : 'Vérifier'}
        </Button>
        <p className="alt center">
          {resendIn > 0 ? (
            <>
              Renvoyer le code dans <strong>{resendIn} s</strong>
            </>
          ) : (
            <>
              Code non reçu ?{' '}
              <button type="button" className="link btn-link" onClick={resend}>
                Renvoyer
              </button>
            </>
          )}
        </p>
      </>
    );
  } else if (screen === 'social') {
    content = (
      <>
        <div className="head center">
          <h1>Bienvenue</h1>
          <p>Connectez-vous en un clic avec un compte que vous utilisez déjà.</p>
        </div>
        {ssoBlock()}
        <p className="fineprint">
          En continuant, vous acceptez les{' '}
          <a href="#" className="link" onClick={(e) => e.preventDefault()}>
            conditions d’utilisation
          </a>{' '}
          et la{' '}
          <a href="#" className="link" onClick={(e) => e.preventDefault()}>
            politique de confidentialité
          </a>
          .
        </p>
        <div className="divider">
          <span>ou</span>
        </div>
        <Link to="/examples/auth/centered" className="email-link">
          <MaterialIcon name="mail" />
          Continuer avec une adresse e-mail
        </Link>
      </>
    );
  } else if (screen === 'accounts') {
    content = (
      <div className="chooser">
        <div className="ch-head">
          <ProviderIcon provider="google" className="big" />
          <h1>Choisissez un compte</h1>
          <p>
            pour continuer vers <strong>SC Storage</strong>
          </p>
        </div>
        <ul className="acc-list">
          {ACCOUNTS.map((a) => (
            <li key={a.mail}>
              <button type="button" onClick={() => pickAccount(a.mail)} disabled={!!ssoBusy}>
                <span className="ava" style={{ background: a.color }}>
                  JK
                </span>
                <span className="grow">
                  <strong>{a.name}</strong>
                  <small>{a.mail}</small>
                </span>
                {a.work && <span className="m3-badge info">Pro</span>}
                {ssoBusy && email === a.mail && <Spinner />}
              </button>
            </li>
          ))}
          <li>
            <button type="button">
              <span className="ava ghost">
                <MaterialIcon name="person_add" />
              </span>
              <span className="grow">
                <strong>Utiliser un autre compte</strong>
              </span>
            </button>
          </li>
        </ul>
        <p className="fineprint">
          Pour continuer, Google partagera votre nom, votre adresse e-mail et votre photo de profil avec SC Storage.
        </p>
      </div>
    );
  } else {
    content = (
      <>
        <div className="lock-user">
          <span className="ava big">{INITIALS}</span>
          <h1>{CURRENT_USER.fullname}</h1>
          <p>{CURRENT_USER.mail}</p>
          <span className="m3-badge warning">
            <MaterialIcon name="lock_clock" />
            Session verrouillée
          </span>
        </div>
        <form
          className="fields"
          onSubmit={(e) => {
            e.preventDefault();
            unlock();
          }}
        >
          <div className="field-box">
            <MaterialIcon name="lock" />
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              autoComplete="current-password"
            />
            {pwdToggle}
          </div>
          {errorLine}
          <Button variant="contained" disableElevation className="submit" type="submit" disabled={busy}>
            {busy ? <Spinner /> : 'Déverrouiller'}
          </Button>
        </form>
        <p className="alt center">
          Pas vous ?{' '}
          <Link to="/examples/auth/image" className="link">
            Changer de compte
          </Link>
        </p>
      </>
    );
  }
  const form = <div className="form">{content}</div>;

  return (
    <div className="ex-auth">
      <div className={`auth layout-${layout} screen-${screen}`}>
        {layout === 'centered' && (
          <>
            <div className="decor" aria-hidden="true">
              <i className="b1" />
              <i className="b2" />
              <i className="b3" />
            </div>
            <main className="panel card">
              <Brand />
              {form}
            </main>
            <Legal />
          </>
        )}
        {layout === 'split-right' && (
          <>
            <aside className="visual">
              <Brand light />
              <div className="pitch">
                <h2>Pilotez toute votre activité depuis un seul espace.</h2>
                <p>
                  Clients, facturation, stocks et planning réunis dans une interface claire, sur ordinateur comme sur
                  mobile.
                </p>
                <ul>
                  <li>
                    <MaterialIcon name="bolt" />
                    Mise en route en 5 minutes
                  </li>
                  <li>
                    <MaterialIcon name="shield" />
                    Données chiffrées et sauvegardées
                  </li>
                  <li>
                    <MaterialIcon name="devices" />
                    Accessible partout, même hors ligne
                  </li>
                </ul>
              </div>
              <div className="float-card fc-1">
                <MaterialIcon name="trending_up" />
                <div>
                  <strong>+18 %</strong>
                  <span>Encaissements</span>
                </div>
              </div>
              <div className="float-card fc-2">
                <span className="avatars">
                  <i>AK</i>
                  <i>MT</i>
                  <i>FD</i>
                </span>
                <div>
                  <strong>2 400+</strong>
                  <span>équipes actives</span>
                </div>
              </div>
            </aside>
            <main className="panel side">
              <Brand compact />
              {form}
              <Legal />
            </main>
          </>
        )}
        {layout === 'split-left' && (
          <>
            <main className="panel side">
              <Brand />
              {form}
              <Legal />
            </main>
            <aside className="visual testimonial">
              <div className="grid-deco" aria-hidden="true" />
              <figure>
                <MaterialIcon name="format_quote" className="quote" />
                <blockquote>
                  Nous avons divisé par deux le temps passé sur la facturation. L’équipe terrain met à jour le planning
                  depuis son téléphone.
                </blockquote>
                <figcaption>
                  <span className="ava">AK</span>
                  <span>
                    <strong>Aya Koné</strong>
                    <small>Directrice des opérations, Sotra Logistique</small>
                  </span>
                </figcaption>
              </figure>
              <div className="stats">
                <div>
                  <strong>98 %</strong>
                  <span>de satisfaction</span>
                </div>
                <div>
                  <strong>4,9/5</strong>
                  <span>sur 1 200 avis</span>
                </div>
                <div>
                  <strong>24/7</strong>
                  <span>support local</span>
                </div>
              </div>
            </aside>
          </>
        )}
        {layout === 'image' && (
          <>
            <div className="photo" aria-hidden="true" />
            <div className="caption">
              <Brand light />
              <p>Entrepôt de Vridi · Abidjan</p>
            </div>
            <main className="panel glass">{form}</main>
          </>
        )}
        {layout === 'minimal' && (
          <>
            <header className="topline">
              <Brand compact />
              <span className="spacer" />
              <Link className="link" to="/examples/auth/register">
                Créer un compte
              </Link>
            </header>
            <main className="panel bare">{form}</main>
            <Legal />
          </>
        )}
      </div>
    </div>
  );
}
