import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from '../../test/renderApp';

describe('KitLayout (shell du catalogue)', () => {
  it('affiche la marque, la barre d’outils et la navigation avec le lien actif', async () => {
    renderAt('/components/buttons');
    expect(await screen.findByRole('heading', { level: 1, name: 'Boutons' })).toBeInTheDocument();
    expect(screen.getByText('Catalogue UI')).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Navigation principale' });
    expect(within(nav).getByRole('link', { name: /Boutons/ })).toHaveClass('active');
    expect(within(nav).getByRole('link', { name: /UI Showcase/ })).not.toHaveClass('active');
  });

  it('filtre la navigation avec la recherche', async () => {
    renderAt('/ui-showcase');
    await screen.findByRole('heading', { level: 1 });
    await userEvent.type(screen.getByLabelText('Rechercher une page'), 'carte');
    const nav = screen.getByRole('navigation', { name: 'Navigation principale' });
    expect(within(nav).getByRole('link', { name: /Cartes/ })).toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: /Boutons/ })).not.toBeInTheDocument();
  });

  it('les écrans d’exemple utilisent le shell SC Storage', async () => {
    renderAt('/examples/app/clients');
    expect(await screen.findByRole('heading', { level: 1, name: 'Clients' })).toBeInTheDocument();
    expect(screen.getAllByText('SC Storage').length).toBeGreaterThan(0);
  });
});
