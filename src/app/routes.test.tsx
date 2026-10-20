import { screen } from '@testing-library/react';
import { renderAt } from '../test/renderApp';
import { isRedirect } from '../types/routes';
import { ROUTE_TABLE } from './routeTable';

describe('routes', () => {
  it('déclare les 53 entrées Angular (7 redirections, 46 composants)', () => {
    expect(ROUTE_TABLE).toHaveLength(53);
    expect(ROUTE_TABLE.filter(isRedirect)).toHaveLength(7);
    expect(new Set(ROUTE_TABLE.map((r) => r.path)).size).toBe(53);
  });

  it.each([
    ['/', '/ui-showcase'],
    ['/page-showcase', '/pages'],
    ['/examples', '/examples/app/dashboard'],
    ['/examples/auth', '/examples/auth/centered'],
    ['/examples/forms', '/examples/forms/contact'],
    ['/route/inconnue', '/ui-showcase'],
  ])('redirige %s vers %s', async (from, to) => {
    const { router } = renderAt(from);
    await screen.findAllByRole('heading', { level: 1 }); // /ui-showcase contient aussi un h1 d'exemple (échelle typographique)
    expect(router.state.location.pathname).toBe(to);
  });

  it('charge la page paramétrée /examples/auth/:variant', async () => {
    renderAt('/examples/auth/split');
    // AuthPage est portée depuis 5d2e905 (plus de page provisoire « variant = … ») : la variante split affiche la connexion.
    expect(await screen.findByRole('heading', { level: 1, name: 'Bon retour !' })).toBeInTheDocument();
  });
});
