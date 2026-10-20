import { Button, IconButton, LinearProgress, ListItemIcon, Menu, MenuItem, Tooltip } from '@mui/material';
import { useState } from 'react';
import { MaterialIcon } from '../../components/ui/MaterialIcon';
import {
  HARNAIS_CONTEXT,
  HARNAIS_CONTEXT_LIMIT,
  HARNAIS_TASKS,
  type HarnaisArtifact,
} from '../../data/static/harnais.data';
import { attachmentIcon } from './harnaisUtils';
import './harnais-menu.scss';
import './side-panel.scss';

export type HarnaisPanelTab = 'artifact' | 'context' | 'tasks';

const PREVIEW_RAIL = ['dashboard', 'people', 'inventory_2', 'support_agent', 'build', 'savings'];
const fr0 = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
const fr1 = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const taskIcon = (s: string) => (s === 'done' ? 'check_circle' : s === 'running' ? 'pending' : 'radio_button_unchecked');

/** Tokens : fichiers chargés + conversation (valeur indicative). */
const USED_TOKENS = HARNAIS_CONTEXT.reduce((sum, f) => sum + f.tokens, 0) + 18_400;
const USAGE = Math.round((USED_TOKENS / HARNAIS_CONTEXT_LIMIT) * 100);
const DONE_COUNT = HARNAIS_TASKS.filter((t) => t.status === 'done').length;

/** Téléchargement local (Blob) — aucun appel réseau. */
function download(art: HarnaisArtifact) {
  const name = art.kind === 'code' ? art.title : art.title.replace(/\W+/g, '-').toLowerCase() + '.md';
  const url = URL.createObjectURL(new Blob([art.content], { type: 'text/plain' }));
  Object.assign(document.createElement('a'), { href: url, download: name }).click();
  URL.revokeObjectURL(url);
}

/** Colonne droite : artefact (code / aperçu), contexte chargé, plan de tâches de l'agent. */
export function SidePanel({
  artifacts,
  artifactId,
  onArtifactIdChange,
  tab,
  onTabChange,
  onClose,
  onCopy,
}: {
  artifacts: HarnaisArtifact[];
  artifactId: string | null;
  onArtifactIdChange: (id: string) => void;
  tab: HarnaisPanelTab;
  onTabChange: (t: HarnaisPanelTab) => void;
  onClose: () => void;
  onCopy: (text: string) => void;
}) {
  const [view, setView] = useState<'code' | 'preview'>('code');
  const [artMenu, setArtMenu] = useState<HTMLElement | null>(null);
  const artifact = artifacts.find((a) => a.id === artifactId) ?? artifacts[0] ?? null;
  const lines = artifact?.content.split('\n') ?? [];

  const tabBtn = (t: HarnaisPanelTab, icon: string, label: string) => (
    <button
      type="button"
      role="tab"
      className={tab === t ? 'on' : ''}
      aria-selected={tab === t}
      onClick={() => onTabChange(t)}
    >
      <MaterialIcon name={icon} />
      {label}
    </button>
  );

  return (
    <div className="hz-side-panel">
      <div className="head">
        <div className="tabs" role="tablist">
          {tabBtn('artifact', 'data_object', 'Artefact')}
          {tabBtn('context', 'folder_open', 'Contexte')}
          {tabBtn('tasks', 'checklist', 'Tâches')}
        </div>
        <Tooltip title="Fermer le panneau">
          <IconButton className="icon-btn" aria-label="Fermer le panneau" onClick={onClose}>
            <MaterialIcon name="close" />
          </IconButton>
        </Tooltip>
      </div>

      <div className="body">
        {tab === 'artifact' &&
          (artifact ? (
            <>
              <div className="art-bar">
                <div className="art-id">
                  <span className="art-icon">
                    <MaterialIcon name={artifact.kind === 'code' ? 'data_object' : 'article'} />
                  </span>
                  <div className="art-text">
                    {artifacts.length > 1 ? (
                      <button type="button" className="art-switch" onClick={(e) => setArtMenu(e.currentTarget)}>
                        {artifact.title}
                        <MaterialIcon name="expand_more" />
                      </button>
                    ) : (
                      <span className="art-title">{artifact.title}</span>
                    )}
                    <span className="art-sub">
                      Version {artifact.version} · {artifact.lang}
                    </span>
                  </div>
                </div>
                <div className="segmented">
                  <button type="button" className={view === 'code' ? 'on' : ''} onClick={() => setView('code')}>
                    Code
                  </button>
                  <button type="button" className={view === 'preview' ? 'on' : ''} onClick={() => setView('preview')}>
                    Aperçu
                  </button>
                </div>
              </div>

              {view === 'code' ? (
                <div className="code">
                  <pre>
                    <code>
                      {lines.map((l, i) => (
                        <span key={i} style={{ display: 'contents' }}>
                          <span className="ln">{i + 1}</span>
                          <span className="lc">{l}</span>
                          {'\n'}
                        </span>
                      ))}
                    </code>
                  </pre>
                </div>
              ) : artifact.kind === 'code' ? (
                /* Aperçu interactif simplifié du composant */
                <div className="preview">
                  <div className="pv-frame">
                    <div className="pv-rail">
                      {PREVIEW_RAIL.map((icon, i) => (
                        <span key={icon} className={`pv-ic${i === 4 ? ' on' : ''}`}>
                          <MaterialIcon name={icon} />
                        </span>
                      ))}
                    </div>
                    <div className="pv-panel">
                      <div className="pv-head">
                        <span className="pv-box">
                          <MaterialIcon name="build" />
                        </span>
                        Intervention
                      </div>
                      <span className="pv-item on">Tableau de bord</span>
                      <span className="pv-item">Missions</span>
                      <span className="pv-item">Interventions programmées</span>
                      <span className="pv-item">Équipe technique</span>
                    </div>
                  </div>
                  <p className="pv-caption">Rendu du Sidecar ouvert sur le module « Intervention ».</p>
                </div>
              ) : (
                <article className="doc">{artifact.content}</article>
              )}

              <div className="art-actions">
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<MaterialIcon name="content_copy" />}
                  onClick={() => onCopy(artifact.content)}
                >
                  Copier
                </Button>
                <span className="spacer" />
                <Button
                  variant="contained"
                  disableElevation
                  startIcon={<MaterialIcon name="download" />}
                  onClick={() => download(artifact)}
                >
                  Télécharger
                </Button>
              </div>

              <Menu
                anchorEl={artMenu}
                open={!!artMenu}
                onClose={() => setArtMenu(null)}
                slotProps={{ paper: { className: 'harnais-menu' } }}
              >
                {artifacts.map((a) => (
                  <MenuItem
                    key={a.id}
                    onClick={() => {
                      onArtifactIdChange(a.id);
                      setArtMenu(null);
                    }}
                  >
                    <ListItemIcon>
                      <MaterialIcon name={a.kind === 'code' ? 'data_object' : 'article'} />
                    </ListItemIcon>
                    {a.title}
                  </MenuItem>
                ))}
              </Menu>
            </>
          ) : (
            <div className="empty">
              <MaterialIcon name="data_object" />
              <strong>Aucun artefact</strong>
              <span>Le code et les documents produits apparaîtront ici.</span>
            </div>
          ))}

        {tab === 'context' && (
          <>
            <section className="card">
              <div className="card-title">
                <MaterialIcon name="memory" />
                Fenêtre de contexte
              </div>
              <div className="usage-line">
                <strong>{fr0(USED_TOKENS)}</strong>
                <span>/ {fr0(HARNAIS_CONTEXT_LIMIT)} tokens</span>
                <span className="pct">{USAGE} %</span>
              </div>
              <LinearProgress variant="determinate" value={USAGE} />
              <div className="legend">
                <span>
                  <i className="dot files" />
                  Fichiers
                </span>
                <span>
                  <i className="dot chat" />
                  Conversation
                </span>
              </div>
            </section>

            <div className="section-label">Fichiers chargés · {HARNAIS_CONTEXT.length}</div>
            <ul className="files">
              {HARNAIS_CONTEXT.map((f) => (
                <li key={f.name}>
                  <span className="f-icon">
                    <MaterialIcon name={attachmentIcon(f.kind)} />
                  </span>
                  <span className="f-text">
                    <span className="f-name">{f.name}</span>
                    <span className="f-path">{f.path}</span>
                  </span>
                  <span className="f-tokens">{fr1(f.tokens / 1000)} k</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {tab === 'tasks' && (
          <>
            <section className="card">
              <div className="card-title">
                <MaterialIcon name="flag" />
                Plan de l'agent
              </div>
              <div className="usage-line">
                <strong>{DONE_COUNT}</strong>
                <span>/ {HARNAIS_TASKS.length} étapes terminées</span>
              </div>
              <LinearProgress variant="determinate" value={(DONE_COUNT / HARNAIS_TASKS.length) * 100} />
            </section>
            <ol className="tasks">
              {HARNAIS_TASKS.map((t) => (
                <li key={t.label} className={t.status}>
                  <MaterialIcon name={taskIcon(t.status)} />
                  <span>{t.label}</span>
                  {t.status === 'running' && <span className="tag">En cours</span>}
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}
