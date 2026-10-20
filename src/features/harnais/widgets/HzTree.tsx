// Porté depuis ui-kit Angular (harnais/components/widgets/tree-widget) : mat-tree → arbre récursif (role="tree").
import { Button, Checkbox } from '@mui/material';
import { useState } from 'react';
import { MaterialIcon } from '../../../components/ui/MaterialIcon';
import type { HzTreeNode } from '../../../data/static/harnais.data';
import { leaves } from './hzTree';
import './tree-widget.scss';

const keyOf = (n: HzTreeNode, path: string) => n.id ?? path;

/** Arborescence : dossiers, organisation, permissions… En mode `selectable`, cases tri-état ; sert aussi d'inspecteur JSON. */
export function HzTree({
  nodes,
  selectable = false,
  submitLabel = 'Valider la sélection',
  answered,
  mono = false,
  onSubmit,
}: {
  nodes: HzTreeNode[];
  selectable?: boolean;
  submitLabel?: string;
  answered?: string;
  mono?: boolean;
  onSubmit?: (labels: string[]) => void;
}) {
  // Inspecteur : le premier niveau est ouvert d'emblée.
  const [open, setOpen] = useState<Set<string>>(() => new Set(mono && nodes[0] ? [keyOf(nodes[0], '0')] : []));
  const [picked, setPicked] = useState<Set<HzTreeNode>>(() => new Set());

  const all: [HzTreeNode, string][] = [];
  const walk = (ns: HzTreeNode[], p: string) =>
    ns.forEach((n, i) => {
      all.push([n, `${p}${i}`]);
      if (n.children) walk(n.children, `${p}${i}.`);
    });
  walk(nodes, '');
  const total = nodes.flatMap(leaves).length;

  const checked = (n: HzTreeNode) => leaves(n).every((l) => picked.has(l));
  const partial = (n: HzTreeNode) => {
    const l = leaves(n);
    const k = l.filter((x) => picked.has(x)).length;
    return k > 0 && k < l.length;
  };
  const toggle = (n: HzTreeNode) => {
    const on = !checked(n);
    setPicked((set) => {
      const next = new Set(set);
      for (const l of leaves(n)) {
        if (on) next.add(l);
        else next.delete(l);
      }
      return next;
    });
  };
  const flip = (k: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  const badge = (n: HzTreeNode) =>
    n.badge ? <span className={`m3-badge ${n.badge.tone ?? 'neutral'}`}>{n.badge.label}</span> : null;

  const render = (ns: HzTreeNode[], depth: number, p: string): React.ReactNode =>
    ns.map((n, i) => {
      const path = `${p}${i}`;
      const k = keyOf(n, path);
      const pad = { paddingLeft: depth * 22 };
      if (!n.children?.length) {
        return (
          <div key={k} role="treeitem" className="mat-tree-node" style={pad}>
            <span className="spacer" />
            {selectable && (
              <Checkbox size="small" checked={checked(n)} disabled={!!answered} onChange={() => toggle(n)} />
            )}
            {n.icon && <MaterialIcon name={n.icon} className="ic leaf" />}
            <span className="label">{n.label}</span>
            {badge(n)}
            {n.meta && <span className="meta">{n.meta}</span>}
          </div>
        );
      }
      const expanded = open.has(k);
      return (
        <div key={k} role="none">
          <div role="treeitem" aria-expanded={expanded} className="mat-tree-node" style={pad}>
            <button type="button" className="twist" aria-label={'Basculer ' + n.label} onClick={() => flip(k)}>
              <MaterialIcon name={expanded ? 'expand_more' : 'chevron_right'} />
            </button>
            {selectable && (
              <Checkbox
                size="small"
                checked={checked(n)}
                indeterminate={partial(n)}
                disabled={!!answered}
                onChange={() => toggle(n)}
              />
            )}
            <MaterialIcon name={n.icon ?? (expanded ? 'folder_open' : 'folder')} className="ic" />
            <span className="label strong">{n.label}</span>
            {badge(n)}
            <span className="meta">{n.meta ?? n.children.length}</span>
          </div>
          {expanded && <div role="group">{render(n.children, depth + 1, `${path}.`)}</div>}
        </div>
      );
    });

  return (
    <div className="hz-tree">
      <div className="toolbar">
        <button
          type="button"
          className="ghost"
          onClick={() => setOpen(new Set(all.filter(([n]) => n.children?.length).map(([n, p]) => keyOf(n, p))))}
        >
          <MaterialIcon name="unfold_more" />
          Déplier
        </button>
        <button type="button" className="ghost" onClick={() => setOpen(new Set())}>
          <MaterialIcon name="unfold_less" />
          Replier
        </button>
        {selectable && (
          <span className="count">
            {picked.size} / {total} sélectionné(s)
          </span>
        )}
      </div>
      <div role="tree" className={`tree${mono ? ' mono' : ''}`}>
        {render(nodes, 0, '')}
      </div>
      {selectable && (
        <div className="foot">
          {answered ? (
            <span className="sent">
              <MaterialIcon name="check_circle" />
              Sélection envoyée
            </span>
          ) : (
            <Button
              variant="contained"
              disableElevation
              disabled={!picked.size}
              onClick={() => onSubmit?.([...picked].map((n) => n.label))}
            >
              <MaterialIcon name="send" />
              {submitLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
