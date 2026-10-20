import { Divider, IconButton, ListItemIcon, Menu, MenuItem, Switch, TextareaAutosize, Tooltip } from '@mui/material';
import { forwardRef, useImperativeHandle, useRef, useState, type KeyboardEvent } from 'react';
import { MaterialIcon } from '../../components/ui/MaterialIcon';
import { HARNAIS_ATTACHABLE, type HarnaisAttachment, type HarnaisModel } from '../../data/static/harnais.data';
import type { HarnaisSendEvent } from './harnaisStore';
import { attachmentIcon } from './harnaisUtils';
import './composer.scss';
import './harnais-menu.scss';

export interface ComposerHandle {
  /** Pré-remplit la saisie (suggestions) et place le curseur à la fin. */
  fill: (text: string) => void;
}

const ABOVE_START = {
  anchorOrigin: { vertical: 'top', horizontal: 'left' },
  transformOrigin: { vertical: 'bottom', horizontal: 'left' },
} as const;
const ABOVE_END = {
  anchorOrigin: { vertical: 'top', horizontal: 'right' },
  transformOrigin: { vertical: 'bottom', horizontal: 'right' },
} as const;

/** Zone de saisie : texte auto-extensible, pièces jointes, outils, choix du modèle, envoi / arrêt. */
export const Composer = forwardRef<
  ComposerHandle,
  {
    models: HarnaisModel[];
    modelId: string;
    onModelIdChange: (id: string) => void;
    generating?: boolean;
    placeholder?: string;
    onSend: (e: HarnaisSendEvent) => void;
    onStop: () => void;
  }
>(function Composer(
  { models, modelId, onModelIdChange, generating = false, placeholder = 'Écrivez votre message…', onSend, onStop },
  ref,
) {
  const field = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState<HarnaisAttachment[]>([]);
  const [extendedThinking, setExtendedThinking] = useState(true);
  const [webSearch, setWebSearch] = useState(false);
  const [menu, setMenu] = useState<{ kind: 'attach' | 'tools' | 'model'; el: HTMLElement } | null>(null);

  const currentModel = models.find((m) => m.id === modelId) ?? models[0];
  const canSend = !generating && (draft.trim().length > 0 || attachments.length > 0);

  useImperativeHandle(ref, () => ({
    fill: (text: string) => {
      setDraft(text);
      queueMicrotask(() => {
        const el = field.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(text.length, text.length);
      });
    },
  }));

  const submit = () => {
    if (!canSend) return;
    onSend({ text: draft.trim(), attachments, extendedThinking, webSearch });
    setDraft('');
    setAttachments([]);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };
  const attach = (file: HarnaisAttachment) => {
    if (attachments.some((a) => a.name === file.name)) return;
    setAttachments((list) => [...list, file]);
  };
  const isAttached = (name: string) => attachments.some((a) => a.name === name);
  const closeMenu = () => setMenu(null);

  return (
    <div className="hz-composer">
      <div className={`composer${generating ? ' busy' : ''}`} onClick={() => field.current?.focus()}>
        {attachments.length > 0 && (
          <div className="chips">
            {attachments.map((a) => (
              <span key={a.name} className="chip">
                <MaterialIcon name={attachmentIcon(a.kind)} className="kind" />
                <span className="name">{a.name}</span>
                <span className="size">{a.size}</span>
                <button
                  type="button"
                  className="remove"
                  aria-label="Retirer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAttachments((list) => list.filter((x) => x.name !== a.name));
                  }}
                >
                  <MaterialIcon name="close" />
                </button>
              </span>
            ))}
          </div>
        )}

        <TextareaAutosize
          ref={field}
          className="field"
          minRows={1}
          maxRows={10}
          placeholder={placeholder}
          aria-label="Message"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
        />

        <div className="bar" onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Joindre un fichier">
            <IconButton className="tool" onClick={(e) => setMenu({ kind: 'attach', el: e.currentTarget })}>
              <MaterialIcon name="add" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Outils">
            <IconButton className="tool" onClick={(e) => setMenu({ kind: 'tools', el: e.currentTarget })}>
              <MaterialIcon name="tune" />
            </IconButton>
          </Tooltip>
          {extendedThinking && (
            <Tooltip title="Désactiver la réflexion étendue">
              <button type="button" className="pill on" onClick={() => setExtendedThinking(false)}>
                <MaterialIcon name="psychology" />
                <span>Réflexion</span>
              </button>
            </Tooltip>
          )}
          {webSearch && (
            <Tooltip title="Désactiver la recherche web">
              <button type="button" className="pill on" onClick={() => setWebSearch(false)}>
                <MaterialIcon name="travel_explore" />
                <span>Web</span>
              </button>
            </Tooltip>
          )}

          <span className="spacer" />

          <button type="button" className="model-btn" onClick={(e) => setMenu({ kind: 'model', el: e.currentTarget })}>
            <span>{currentModel?.label}</span>
            <MaterialIcon name="expand_more" />
          </button>

          {generating ? (
            <Tooltip title="Arrêter">
              <button type="button" className="send stop" onClick={onStop} aria-label="Arrêter la génération">
                <MaterialIcon name="stop" />
              </button>
            </Tooltip>
          ) : (
            <Tooltip title="Envoyer (Entrée)">
              <span style={{ display: 'contents' }}>
                <button type="button" className="send" disabled={!canSend} onClick={submit} aria-label="Envoyer">
                  <MaterialIcon name="arrow_upward" />
                </button>
              </span>
            </Tooltip>
          )}
        </div>
      </div>

      <Menu
        anchorEl={menu?.el}
        open={menu?.kind === 'attach'}
        onClose={closeMenu}
        {...ABOVE_START}
        slotProps={{ paper: { className: 'harnais-menu' } }}
      >
        <div className="menu-caption">Fichiers récents</div>
        {HARNAIS_ATTACHABLE.map((f) => (
          <MenuItem
            key={f.name}
            disabled={isAttached(f.name)}
            onClick={() => {
              attach(f);
              closeMenu();
            }}
          >
            <ListItemIcon>
              <MaterialIcon name={attachmentIcon(f.kind)} />
            </ListItemIcon>
            {f.name}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem disabled>
          <ListItemIcon>
            <MaterialIcon name="upload_file" />
          </ListItemIcon>
          Importer depuis l'ordinateur
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={menu?.el}
        open={menu?.kind === 'tools'}
        onClose={closeMenu}
        {...ABOVE_START}
        slotProps={{ paper: { className: 'harnais-menu' } }}
      >
        <div className="menu-toggle">
          <MaterialIcon name="psychology" />
          <span className="label">
            <strong>Réflexion étendue</strong>
            <small>Raisonne avant de répondre</small>
          </span>
          <Switch
            checked={extendedThinking}
            onChange={(e) => setExtendedThinking(e.target.checked)}
            slotProps={{ input: { 'aria-label': 'Réflexion étendue' } }}
          />
        </div>
        <div className="menu-toggle">
          <MaterialIcon name="travel_explore" />
          <span className="label">
            <strong>Recherche web</strong>
            <small>Consulte des sources récentes</small>
          </span>
          <Switch
            checked={webSearch}
            onChange={(e) => setWebSearch(e.target.checked)}
            slotProps={{ input: { 'aria-label': 'Recherche web' } }}
          />
        </div>
      </Menu>

      <Menu
        anchorEl={menu?.el}
        open={menu?.kind === 'model'}
        onClose={closeMenu}
        {...ABOVE_END}
        slotProps={{ paper: { className: 'harnais-menu' } }}
      >
        {models.map((m) => (
          <MenuItem
            key={m.id}
            className="model-item"
            onClick={() => {
              onModelIdChange(m.id);
              closeMenu();
            }}
          >
            <span className="model-line">
              <span className="model-text">
                <strong>
                  {m.label} {m.badge && <span className="badge">{m.badge}</span>}
                </strong>
                <small>{m.description}</small>
              </span>
              {m.id === modelId && <MaterialIcon name="check" className="check" />}
            </span>
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
});
