import type { Modifier } from '@dnd-kit/core';

/** Verrouille l'axe Y (équivalent cdkDragLockAxis="y"). */
export const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

/** Garde l'élément dans son conteneur parent (équivalent cdkDragBoundary). */
export const restrictToParentElement: Modifier = ({ transform, draggingNodeRect, containerNodeRect }) => {
  if (!draggingNodeRect || !containerNodeRect) return transform;
  const z = containerNodeRect;
  const r = draggingNodeRect;
  let { x, y } = transform;
  if (r.left + x < z.left) x = z.left - r.left;
  if (r.right + x > z.right) x = z.right - r.right;
  if (r.top + y < z.top) y = z.top - r.top;
  if (r.bottom + y > z.bottom) y = z.bottom - r.bottom;
  return { ...transform, x, y };
};
