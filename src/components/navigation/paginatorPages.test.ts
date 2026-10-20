import { visiblePages } from './paginatorPages';

describe('visiblePages', () => {
  it('reprend l’algorithme Angular (ellipses autour de la page courante)', () => {
    expect(visiblePages(1, 3)).toEqual([1, 2, 3]);
    expect(visiblePages(3, 52)).toEqual([1, 2, 3, 4, '...', 52]);
    expect(visiblePages(10, 52)).toEqual([1, '...', 9, 10, 11, '...', 52]);
    expect(visiblePages(52, 52)).toEqual([1, '...', 51, 52]);
  });
});
