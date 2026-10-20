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

describe('ExampleAppLayout (barre d’outils de ex-app-shell)', () => {
  it('affiche le fil d’Ariane, Messages, Notifications avec badges et le compte', async () => {
    renderAt('/examples/app/dashboard');
    await screen.findByRole('heading', { level: 1, name: 'Tableau de bord' });
    const toolbar = document.querySelector('.kit-toolbar') as HTMLElement;
    expect(within(toolbar).getByText('Accueil')).toHaveClass('crumb');
    expect(within(toolbar).getByText('Tableau de bord')).toHaveClass('cur');
    expect(within(toolbar).getByRole('button', { name: 'Messages' })).toHaveTextContent('7');
    expect(within(toolbar).getByRole('button', { name: 'Notifications, 3 non lues' })).toHaveTextContent('3');
    expect(within(toolbar).getByRole('button', { name: 'Mon compte' })).toHaveTextContent('JK');
  });

  it('masque le bouton Messages sur la messagerie instantanée', async () => {
    renderAt('/examples/app/chat');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('button', { name: 'Messages' })).not.toBeInTheDocument();
  });
});
