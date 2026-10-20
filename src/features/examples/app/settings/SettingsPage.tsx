import { Button, Checkbox, Switch } from '@mui/material';
import { useState } from 'react';
import { ConfirmDialog } from '../../../../components/feedback/dialogs/ConfirmDialog';
import { useDialog } from '../../../../components/feedback/dialogs/useDialog';
import { useSnackbar } from '../../../../components/feedback/useSnackbar';
import { CopyField } from '../../../../components/fields/CopyField';
import { PasswordField } from '../../../../components/fields/PasswordField';
import { TagInput } from '../../../../components/fields/TagInput';
import { MaterialIcon } from '../../../../components/ui/MaterialIcon';
import { ThemeSettings } from '../../../../components/ui/ThemeSettings';
import '../../ex-page.scss';
import './settings.scss';

const SECTIONS = [
  { id: 'profile', label: 'Profil', icon: 'person' },
  { id: 'security', label: 'Sécurité', icon: 'shield' },
  { id: 'api', label: 'API & intégrations', icon: 'key' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications' },
  { id: 'appearance', label: 'Apparence', icon: 'palette' },
  { id: 'danger', label: 'Zone sensible', icon: 'warning' },
];
const SKILL_SUGGESTIONS = ['Logistique', 'Facturation', 'Formation', 'Support', 'Achats', 'Comptabilité'];
const SESSIONS = [
  { device: 'MacBook Pro · Chrome', where: 'Abidjan · maintenant', icon: 'laptop_mac', current: true },
  { device: 'iPhone 15 Pro · Safari', where: 'Abidjan · il y a 2 h', icon: 'phone_iphone', current: false },
];
type Channel = 'mail' | 'push' | 'sms';

/** /examples/app/settings — sous-navigation de sections, réglages en lignes « libellé / contrôle », thème réel, clés d'API, zone sensible confirmée. */
export function SettingsPage() {
  const dialog = useDialog();
  const snack = useSnackbar();
  const [section, setSection] = useState('profile');
  const [secret, setSecret] = useState('sk_demo_51Nf3a9QeLx2Tb8Rk0pYv');
  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState({
    first: 'Jean',
    last: 'Kouassi',
    mail: 'jean.kouassi@example.com',
    phone: '+225 07 07 12 34 56',
    bio: 'Administrateur de l’espace SC Storage.',
    skills: ['Logistique', 'Formation'],
  });
  const [security, setSecurity] = useState([
    { label: 'Vérification en deux étapes', sub: 'Code SMS à chaque nouvelle connexion', on: true },
    { label: 'Connexion avec Google', sub: 'jean.kouassi@gmail.com', on: true },
    { label: 'Alertes de connexion', sub: 'E-mail lors d’une connexion inhabituelle', on: false },
  ]);
  const [notifs, setNotifs] = useState([
    { label: 'Nouvelles factures', sub: 'Émises par votre équipe', mail: true, push: true, sms: false },
    { label: 'Paiements reçus', sub: 'Tous moyens de paiement', mail: true, push: false, sms: false },
    { label: 'Relances', sub: 'Factures échues', mail: false, push: true, sms: true },
    { label: 'Mentions', sub: 'Commentaires et fil d’équipe', mail: true, push: true, sms: false },
  ]);
  const [compact, setCompact] = useState(false);

  const set = (p: Partial<typeof profile>) => setProfile((x) => ({ ...x, ...p }));
  const save = (msg = 'Modifications enregistrées') => snack(msg, { action: 'OK', duration: 2500 });
  const regenerate = () => {
    setSecret('sk_demo_' + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12));
    save('Nouvelle clé secrète générée');
  };
  const deleteAccount = async () => {
    const ok = await dialog<boolean>(
      (ref) => (
        <ConfirmDialog
          dialog={ref}
          data={{
            title: 'Supprimer le compte ?',
            message:
              'Votre compte, vos accès et vos préférences seront supprimés définitivement. Cette action est irréversible.',
            confirmLabel: 'Supprimer définitivement',
            type: 'danger',
          }}
        />
      ),
      { width: '440px' },
    );
    if (ok) save('Suppression simulée (exemple statique)');
  };
  const toggleNotif = (i: number, ch: Channel, v: boolean) =>
    setNotifs((l) => l.map((n, j) => (j === i ? { ...n, [ch]: v } : n)));

  return (
    <div className="ex-page ex-settings">
      <div className="page-head">
        <div className="titles">
          <span className="eyebrow">Compte</span>
          <h1>Paramètres</h1>
          <p>Profil, sécurité et préférences de l’espace de travail.</p>
        </div>
      </div>
      <div className="layout">
        <nav className="sub" aria-label="Sections">
          {SECTIONS.map((s) => (
            <button key={s.id} className={section === s.id ? 'on' : ''} onClick={() => setSection(s.id)}>
              <MaterialIcon name={s.icon} />
              <span>{s.label}</span>
            </button>
          ))}
        </nav>

        <div className="panes">
          {section === 'profile' && (
            <section className="card pane">
              <header>
                <h2>Profil</h2>
                <p>Visible par les membres de votre organisation.</p>
              </header>
              <div className="set">
                <div className="s-lbl">
                  <strong>Photo</strong>
                  <small>JPG ou PNG, 2 Mo maximum.</small>
                </div>
                <div className="s-ctl avatar-row">
                  <span className="ava lg">JK</span>
                  <Button variant="outlined" color="inherit" startIcon={<MaterialIcon name="upload" />}>
                    Changer
                  </Button>
                  <Button>Retirer</Button>
                </div>
              </div>
              <div className="set">
                <div className="s-lbl">
                  <strong>Nom</strong>
                </div>
                <div className="s-ctl row-2">
                  <div className="form-field">
                    <div className="field-box">
                      <input
                        value={profile.first}
                        onChange={(e) => set({ first: e.target.value })}
                        aria-label="Prénom"
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <div className="field-box">
                      <input value={profile.last} onChange={(e) => set({ last: e.target.value })} aria-label="Nom" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="set">
                <div className="s-lbl">
                  <strong>Coordonnées</strong>
                  <small>L’e-mail sert à la connexion.</small>
                </div>
                <div className="s-ctl col">
                  <div className="form-field">
                    <div className="field-box">
                      <MaterialIcon name="mail" />
                      <input value={profile.mail} onChange={(e) => set({ mail: e.target.value })} aria-label="E-mail" />
                    </div>
                  </div>
                  <div className="form-field">
                    <div className="field-box">
                      <MaterialIcon name="call" />
                      <input
                        value={profile.phone}
                        onChange={(e) => set({ phone: e.target.value })}
                        aria-label="Téléphone"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="set">
                <div className="s-lbl">
                  <strong>Compétences</strong>
                  <small>Aide vos collègues à vous mentionner.</small>
                </div>
                <div className="s-ctl">
                  <TagInput
                    value={profile.skills}
                    onChange={(skills) => set({ skills })}
                    suggestions={SKILL_SUGGESTIONS}
                    placeholder="Ajouter une compétence"
                  />
                </div>
              </div>
              <div className="set">
                <div className="s-lbl">
                  <strong>Bio</strong>
                </div>
                <div className="s-ctl">
                  <div className="form-field">
                    <div className="field-box textarea-box">
                      <textarea
                        rows={3}
                        value={profile.bio}
                        onChange={(e) => set({ bio: e.target.value })}
                        aria-label="Bio"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <footer>
                <Button>Annuler</Button>
                <Button variant="contained" disableElevation onClick={() => save()}>
                  Enregistrer
                </Button>
              </footer>
            </section>
          )}
          {section === 'security' && (
            <>
              <section className="card pane">
                <header>
                  <h2>Mot de passe</h2>
                  <p>12 caractères minimum, avec majuscules, chiffres et symboles.</p>
                </header>
                <div className="set">
                  <div className="s-lbl">
                    <strong>Nouveau mot de passe</strong>
                    <small>Dernière modification il y a 3 mois.</small>
                  </div>
                  <div className="s-ctl col">
                    <PasswordField value={password} onChange={setPassword} generator />
                  </div>
                </div>
                <footer>
                  <Button
                    variant="contained"
                    disableElevation
                    disabled={password.length < 8}
                    onClick={() => save('Mot de passe mis à jour')}
                  >
                    Mettre à jour
                  </Button>
                </footer>
              </section>
              <section className="card pane">
                <header>
                  <h2>Connexion</h2>
                  <p>Protégez l’accès à votre compte.</p>
                </header>
                {security.map((o, i) => (
                  <div key={o.label} className="set inline">
                    <div className="s-lbl">
                      <strong>{o.label}</strong>
                      <small>{o.sub}</small>
                    </div>
                    <Switch
                      checked={o.on}
                      onChange={(e) =>
                        setSecurity((l) => l.map((x, j) => (j === i ? { ...x, on: e.target.checked } : x)))
                      }
                      slotProps={{ input: { 'aria-label': o.label } }}
                    />
                  </div>
                ))}
              </section>
              <section className="card pane">
                <header>
                  <h2>Sessions actives</h2>
                  <p>Appareils actuellement connectés.</p>
                </header>
                {SESSIONS.map((s) => (
                  <div key={s.device} className="set inline">
                    <span className="ic-tile">
                      <MaterialIcon name={s.icon} />
                    </span>
                    <div className="s-lbl">
                      <strong>{s.device}</strong>
                      <small>{s.where}</small>
                    </div>
                    {s.current ? (
                      <span className="m3-badge success">Cette session</span>
                    ) : (
                      <Button color="error">Déconnecter</Button>
                    )}
                  </div>
                ))}
              </section>
            </>
          )}
          {section === 'api' && (
            <section className="card pane">
              <header>
                <h2>Clés d’API</h2>
                <p>Accès programmatique à vos données. Ne partagez jamais la clé secrète.</p>
              </header>
              <div className="set">
                <div className="s-lbl">
                  <strong>Identifiant public</strong>
                  <small>Utilisable côté navigateur.</small>
                </div>
                <div className="s-ctl">
                  <CopyField value="pk_live_7Hk2pQ9xWm4ZcV1n" icon="key" label="l’identifiant public" />
                </div>
              </div>
              <div className="set">
                <div className="s-lbl">
                  <strong>Clé secrète</strong>
                  <small>Créée le 2 septembre 2026.</small>
                </div>
                <div className="s-ctl">
                  <CopyField
                    value={secret}
                    icon="lock"
                    label="la clé secrète"
                    secret
                    regenerable
                    onRegenerate={regenerate}
                  />
                </div>
              </div>
              <div className="set">
                <div className="s-lbl">
                  <strong>Webhook</strong>
                  <small>Événements facture et paiement.</small>
                </div>
                <div className="s-ctl">
                  <CopyField value="https://api.scstorage.ci/hooks/7Hk2-pQ" icon="webhook" label="l’URL du webhook" />
                </div>
              </div>
            </section>
          )}
          {section === 'notifications' && (
            <section className="card pane">
              <header>
                <h2>Notifications</h2>
                <p>Choisissez où être prévenu pour chaque événement.</p>
              </header>
              <table className="matrix">
                <thead>
                  <tr>
                    <th>Événement</th>
                    <th>E-mail</th>
                    <th>Push</th>
                    <th>SMS</th>
                  </tr>
                </thead>
                <tbody>
                  {notifs.map((n, i) => (
                    <tr key={n.label}>
                      <td>
                        {n.label}
                        <small>{n.sub}</small>
                      </td>
                      {(['mail', 'push', 'sms'] as Channel[]).map((ch) => (
                        <td key={ch}>
                          <Checkbox
                            checked={n[ch]}
                            onChange={(e) => toggleNotif(i, ch, e.target.checked)}
                            slotProps={{
                              input: {
                                'aria-label': `${n.label} ${ch === 'mail' ? 'par e-mail' : ch === 'push' ? 'en push' : 'par SMS'}`,
                              },
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
          {section === 'appearance' && (
            <>
              <section className="card pane">
                <header>
                  <h2>Apparence</h2>
                  <p>Mode et couleur s’appliquent immédiatement à toute l’interface.</p>
                </header>
                <div className="theme-settings">
                  <ThemeSettings />
                </div>
              </section>
              <section className="card pane">
                <header>
                  <h2>Préférences régionales</h2>
                </header>
                <div className="set inline">
                  <div className="s-lbl">
                    <strong>Affichage compact</strong>
                    <small>Réduit l’espacement des listes et tableaux.</small>
                  </div>
                  <Switch
                    checked={compact}
                    onChange={(e) => setCompact(e.target.checked)}
                    slotProps={{ input: { 'aria-label': 'Affichage compact' } }}
                  />
                </div>
                <div className="set inline">
                  <div className="s-lbl">
                    <strong>Langue</strong>
                    <small>Français (Côte d’Ivoire)</small>
                  </div>
                  <Button variant="outlined" color="inherit">
                    Modifier
                  </Button>
                </div>
                <div className="set inline">
                  <div className="s-lbl">
                    <strong>Fuseau horaire</strong>
                    <small>GMT · Abidjan</small>
                  </div>
                  <Button variant="outlined" color="inherit">
                    Modifier
                  </Button>
                </div>
              </section>
            </>
          )}
          {section === 'danger' && (
            <section className="card pane danger">
              <header>
                <h2>Zone sensible</h2>
                <p>Ces actions sont définitives.</p>
              </header>
              <div className="set inline">
                <div className="s-lbl">
                  <strong>Exporter mes données</strong>
                  <small>Archive ZIP de toutes vos données, envoyée par e-mail.</small>
                </div>
                <Button variant="outlined" color="inherit" onClick={() => save('Export demandé')}>
                  Exporter
                </Button>
              </div>
              <div className="set inline">
                <div className="s-lbl">
                  <strong>Supprimer le compte</strong>
                  <small>Supprime définitivement votre compte et vos accès.</small>
                </div>
                <Button variant="contained" color="error" disableElevation onClick={() => void deleteAccount()}>
                  Supprimer
                </Button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
