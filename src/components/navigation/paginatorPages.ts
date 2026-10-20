/** Numéros visibles (même algorithme que PaginatorComponent.visiblePages). */
export function visiblePages(current: number, totalPages: number): (number | '...')[] {
  const pages: (number | '...')[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }
  pages.push(1);
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  for (let i = start; i <= end; i++) if (i > 1 && i < totalPages) pages.push(i);
  if (current < totalPages - 2) pages.push('...');
  pages.push(totalPages);
  return pages;
}
