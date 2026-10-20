import { Tooltip } from '@mui/material';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { MEDIA_ICON, mediaKind } from '../../lib/media/mediaUtils';
import { MaterialIcon } from '../ui/MaterialIcon';
import './upload-queue.scss';
import { simulatedUploader } from './uploader';
import type { UploadItem, UploadStatus, Uploader } from './uploadTypes';

export type { UploadItem, UploadStatus, Uploader } from './uploadTypes';

const size = (b: number) =>
  b >= 1048576
    ? `${(b / 1048576).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`
    : `${Math.max(1, Math.round(b / 1024))} Ko`;

export interface UploadQueueHandle {
  add: (files: File[]) => void;
}

/** app-upload-queue : dépôt / clic / collage, validation, progression, envois parallèles limités. */
export const UploadQueue = forwardRef<
  UploadQueueHandle,
  {
    accept?: string;
    maxSize?: number;
    maxFiles?: number;
    concurrency?: number;
    autoStart?: boolean;
    uploader?: Uploader;
    hint?: string;
    onCompleted?: (f: File[]) => void;
    onRejected?: (r: { file: File; reason: string }[]) => void;
  }
>(function UploadQueue(
  {
    accept = '',
    maxSize = 25 * 1024 * 1024,
    maxFiles = 20,
    concurrency = 2,
    autoStart = true,
    uploader = simulatedUploader,
    hint = '',
    onCompleted,
    onRejected,
  },
  ref,
) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [rejections, setRejections] = useState<{ name: string; reason: string }[]>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const cancels = useRef(new Map<string, () => void>());
  const seq = useRef(0);
  const completedRef = useRef(onCompleted);
  completedRef.current = onCompleted;

  const update = useCallback((fn: (l: UploadItem[]) => UploadItem[]) => {
    itemsRef.current = fn(itemsRef.current);
    setItems(itemsRef.current);
  }, []);
  const patch = useCallback(
    (id: string, p: Partial<UploadItem>) => update((l) => l.map((i) => (i.id === id ? { ...i, ...p } : i))),
    [update],
  );

  const pump = useCallback(() => {
    const l = itemsRef.current;
    const running = l.filter((i) => i.status === 'uploading').length;
    const next = l
      .filter((i) => i.status === 'queued')
      .reverse()
      .slice(0, Math.max(0, concurrency - running));
    for (const it of next) {
      patch(it.id, { status: 'uploading', progress: 0, error: undefined });
      const stop = uploader(it.file, {
        progress: (p) => patch(it.id, { progress: p }),
        error: (e) => {
          cancels.current.delete(it.id);
          patch(it.id, { status: 'error', error: e.message || 'Échec de l’envoi' });
          pump();
        },
        done: () => {
          cancels.current.delete(it.id);
          patch(it.id, { status: 'done', progress: 100 });
          pump();
          const busy = itemsRef.current.some((i) => i.status === 'uploading' || i.status === 'queued');
          if (!busy) completedRef.current?.(itemsRef.current.filter((i) => i.status === 'done').map((i) => i.file));
        },
      });
      cancels.current.set(it.id, stop);
    }
  }, [concurrency, patch, uploader]);

  useEffect(() => () => cancels.current.forEach((s) => s()), []);

  const accepts = (f: File) => {
    const rules = accept
      .split(',')
      .map((r) => r.trim().toLowerCase())
      .filter(Boolean);
    if (!rules.length) return true;
    const name = f.name.toLowerCase(),
      type = f.type.toLowerCase();
    return rules.some((r) =>
      r.startsWith('.') ? name.endsWith(r) : r.endsWith('/*') ? type.startsWith(r.slice(0, -1)) : type === r,
    );
  };
  const add = (files: File[]) => {
    const rej: { file: File; reason: string }[] = [];
    const room = maxFiles - itemsRef.current.filter((i) => i.status !== 'canceled').length;
    const ok = files.filter((f, k) => {
      if (k >= room) {
        rej.push({ file: f, reason: `limite de ${maxFiles} fichiers atteinte` });
        return false;
      }
      if (!accepts(f)) {
        rej.push({ file: f, reason: 'type non autorisé' });
        return false;
      }
      if (f.size > maxSize) {
        rej.push({ file: f, reason: `dépasse ${size(maxSize)}` });
        return false;
      }
      return true;
    });
    setRejections(rej.map((r) => ({ name: r.file.name, reason: r.reason })));
    if (rej.length) onRejected?.(rej);
    update((l) => [
      ...ok.map((file) => ({ id: 'u' + ++seq.current, file, progress: 0, status: 'queued' as UploadStatus })),
      ...l,
    ]);
    if (autoStart) pump();
  };
  useImperativeHandle(ref, () => ({ add }));

  const cancel = (it: UploadItem) => {
    cancels.current.get(it.id)?.();
    cancels.current.delete(it.id);
    const cur = itemsRef.current.find((i) => i.id === it.id);
    if (cur && (cur.status === 'uploading' || cur.status === 'queued')) patch(it.id, { status: 'canceled' });
    pump();
  };
  const retry = (it: UploadItem) => {
    patch(it.id, { status: 'queued', progress: 0, error: undefined });
    pump();
  };
  const remove = (it: UploadItem) => {
    cancel(it);
    update((l) => l.filter((i) => i.id !== it.id));
  };
  const clearDone = () => update((l) => l.filter((i) => i.status !== 'done' && i.status !== 'canceled'));
  const cancelAll = () =>
    itemsRef.current.filter((i) => i.status === 'uploading' || i.status === 'queued').forEach(cancel);
  const retryAll = () => {
    itemsRef.current.filter((i) => i.status === 'error').forEach((i) => patch(i.id, { status: 'queued', progress: 0 }));
    pump();
  };

  const browse = () => {
    const el = document.createElement('input');
    el.type = 'file';
    el.multiple = true;
    if (accept) el.accept = accept;
    el.onchange = () => add(Array.from(el.files ?? []));
    el.click();
  };

  const active = items.filter((i) => i.status !== 'canceled');
  const totalBytes = active.reduce((s, i) => s + i.file.size, 0);
  const totalProgress = totalBytes
    ? Math.round(
        (active.reduce((s, i) => s + (i.file.size * (i.status === 'done' ? 100 : i.progress)) / 100, 0) / totalBytes) *
          100,
      )
    : 0;
  const counts = useMemo(() => {
    const c = { queued: 0, uploading: 0, done: 0, error: 0, canceled: 0 };
    items.forEach((i) => c[i.status]++);
    return c;
  }, [items]);
  const busy = counts.uploading + counts.queued > 0;
  const acceptLabel = hint || `${accept ? accept.split(',').join(', ') + ' · ' : ''}max ${size(maxSize)} par fichier`;

  return (
    <div className="uq">
      <div
        className={`uq-drop${dragging ? ' over' : ''}`}
        tabIndex={0}
        role="button"
        aria-label="Ajouter des fichiers"
        onClick={browse}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            browse();
          }
        }}
        onPaste={(e) => {
          const f = Array.from(e.clipboardData.files);
          if (f.length) {
            e.preventDefault();
            add(f);
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          add(Array.from(e.dataTransfer.files));
        }}
      >
        <span className="uq-drop-ic">
          <MaterialIcon name={dragging ? 'file_download' : 'cloud_upload'} />
        </span>
        <strong>{dragging ? 'Déposez pour ajouter' : 'Glissez vos fichiers ici'}</strong>
        <span>
          ou <u>parcourez</u> · collez (Ctrl+V)
        </span>
        <small>{acceptLabel}</small>
      </div>

      {rejections.length > 0 && (
        <div className="uq-rejected">
          <MaterialIcon name="block" />
          <div>
            {rejections.map((r, k) => (
              <div key={k}>
                <b>{r.name}</b> : {r.reason}
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setRejections([])} aria-label="Masquer">
            <MaterialIcon name="close" />
          </button>
        </div>
      )}

      {items.length > 0 && (
        <>
          <div className="uq-summary">
            <div className="uq-sum-text">
              <strong>
                {busy ? 'Envoi en cours…' : counts.error ? 'Envoi terminé avec des erreurs' : 'Envoi terminé'}
              </strong>
              <span>
                {counts.done} / {active.length} fichier(s) · {size(totalBytes)}
                {counts.error > 0 && (
                  <>
                    {' '}
                    · <em>{counts.error} en erreur</em>
                  </>
                )}
              </span>
            </div>
            <span className="spacer" />
            {counts.error > 0 && (
              <button type="button" className="uq-link" onClick={retryAll}>
                <MaterialIcon name="refresh" />
                Tout réessayer
              </button>
            )}
            {busy ? (
              <button type="button" className="uq-link" onClick={cancelAll}>
                Tout annuler
              </button>
            ) : (
              <button type="button" className="uq-link" onClick={clearDone}>
                Vider la liste
              </button>
            )}
          </div>
          <div className="uq-total">
            <i style={{ width: `${totalProgress}%` }} className={counts.error && !busy ? 'err' : ''} />
          </div>
          <ul className="uq-list">
            {items.map((it) => (
              <li key={it.id} className="uq-item" data-status={it.status}>
                <span className="uq-ic">
                  <MaterialIcon name={MEDIA_ICON[mediaKind(it.file.name, it.file.type)]} />
                </span>
                <div className="uq-main">
                  <div className="uq-line">
                    <span className="uq-name" title={it.file.name}>
                      {it.file.name}
                    </span>
                    <span className="uq-size">{size(it.file.size)}</span>
                  </div>
                  {it.status === 'uploading' && (
                    <div className="uq-row">
                      <div className="uq-bar">
                        <i style={{ width: `${it.progress}%` }} />
                      </div>
                      <span className="uq-state">{it.progress} %</span>
                    </div>
                  )}
                  {it.status === 'queued' && (
                    <div className="uq-row">
                      <div className="uq-bar idle" />
                      <span className="uq-state">En attente…</span>
                    </div>
                  )}
                  {it.status === 'done' && (
                    <span className="uq-state ok">
                      <MaterialIcon name="check_circle" />
                      Envoyé
                    </span>
                  )}
                  {it.status === 'error' && (
                    <span className="uq-state err">
                      <MaterialIcon name="error" />
                      {it.error}
                    </span>
                  )}
                  {it.status === 'canceled' && (
                    <span className="uq-state">
                      <MaterialIcon name="do_not_disturb_on" />
                      Annulé
                    </span>
                  )}
                </div>
                <div className="uq-actions">
                  {(it.status === 'uploading' || it.status === 'queued') && (
                    <Tooltip title="Annuler">
                      <button type="button" onClick={() => cancel(it)}>
                        <MaterialIcon name="close" />
                      </button>
                    </Tooltip>
                  )}
                  {(it.status === 'error' || it.status === 'canceled') && (
                    <Tooltip title="Réessayer">
                      <button type="button" onClick={() => retry(it)}>
                        <MaterialIcon name="refresh" />
                      </button>
                    </Tooltip>
                  )}
                  {it.status !== 'uploading' && (
                    <Tooltip title="Retirer">
                      <button type="button" onClick={() => remove(it)}>
                        <MaterialIcon name="delete_outline" />
                      </button>
                    </Tooltip>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
});
