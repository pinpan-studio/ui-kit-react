// Porté depuis ui-kit Angular (harnais/components/widgets/tree-widget.component.ts : leaves, jsonToNodes).
import type { HzTreeNode } from '../../../data/static/harnais.data';

export function leaves(n: HzTreeNode): HzTreeNode[] {
  return n.children?.length ? n.children.flatMap(leaves) : [n];
}

/** Convertit n'importe quelle donnée JSON en nœuds d'arbre (inspecteur). */
export function jsonToNodes(data: unknown, key = 'racine', path = 'r'): HzTreeNode[] {
  if (data !== null && typeof data === 'object') {
    const entries = Array.isArray(data)
      ? data.map((v, i) => [String(i), v] as const)
      : Object.entries(data as Record<string, unknown>);
    return [
      {
        id: path,
        label: key,
        icon: Array.isArray(data) ? 'data_array' : 'data_object',
        meta: Array.isArray(data) ? `[${entries.length}]` : `{${entries.length}}`,
        children: entries.flatMap(([k, v]) => jsonToNodes(v, k, `${path}.${k}`)),
      },
    ];
  }
  const kind = data === null ? 'null' : typeof data;
  const value = typeof data === 'string' ? `"${data}"` : String(data);
  return [
    {
      id: path,
      label: `${key}: ${value}`,
      icon: kind === 'number' ? 'tag' : kind === 'boolean' ? 'toggle_on' : 'text_fields',
      meta: kind,
    },
  ];
}
