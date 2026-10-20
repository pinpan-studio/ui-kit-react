import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from '../../test/renderApp';

describe('Pages du catalogue portées', () => {
  it('/components liste les 13 catégories avec leur description', async () => {
    renderAt('/components');
    await screen.findByRole('heading', { level: 1, name: 'Composants' });
    const cards = document.querySelectorAll('.cat-card');
    expect(cards).toHaveLength(13);
    expect(within(cards[3] as HTMLElement).getByText(/Primary, secondary, outline/)).toBeInTheDocument();
  });

  it('/components/buttons : sommaire, variantes et bouton de chargement simulé', async () => {
    renderAt('/components/buttons');
    await screen.findByRole('heading', { level: 1, name: 'Boutons' });
    for (const t of ['Variantes', 'États', 'Icon buttons', 'Menu & split', 'FAB']) {
      expect(screen.getByRole('heading', { level: 2, name: t })).toBeInTheDocument();
    }
    const states = document.getElementById('states') as HTMLElement;
    await userEvent.click(within(states).getByRole('button', { name: 'Enregistrer' }));
    expect(within(states).getByRole('button', { name: /Enregistrement…/ })).toBeDisabled();
    const menu = document.getElementById('menu') as HTMLElement;
    await userEvent.click(within(menu).getByRole('button', { name: /Exporter/ }));
    expect(await screen.findByRole('menuitem', { name: /Excel/ })).toBeInTheDocument();
  });

  it('/components/interactions : la visite guidée démarre et se ferme avec Échap', async () => {
    renderAt('/components/interactions');
    await screen.findByRole('heading', { level: 1, name: 'Interactions' });
    await userEvent.click(screen.getByRole('button', { name: /Lancer la visite/ }));
    expect(await screen.findByRole('dialog', { name: 'Bienvenue dans le tableau de bord' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(await screen.findByRole('dialog', { name: 'Recherche globale' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(await screen.findByText('Visite interrompue')).toBeInTheDocument();
  });

  it('/components/typography : familles, échelle et préview des polices', async () => {
    renderAt('/components/typography');
    await screen.findByRole('heading', { level: 1, name: 'Typographie' });
    expect(screen.getByRole('heading', { level: 2, name: 'Familles de polices' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Échelle typographique' })).toBeInTheDocument();
    expect(screen.getAllByText('TT Wellingtons').length).toBeGreaterThan(0);
  });

  it('/components/material : accordéon en étapes, chips et virtual scroll', async () => {
    renderAt('/components/material');
    await screen.findByRole('heading', { level: 1, name: 'Material & CDK' });
    await userEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(await screen.findByRole('button', { name: 'Précédent' })).toBeInTheDocument();
    const input = screen.getByPlaceholderText('Nouvelle étiquette…');
    await userEvent.type(input, 'Bouaké{Enter}');
    expect(screen.getByText('Bouaké', { selector: '.MuiChip-label' })).toBeInTheDocument();
    expect(document.querySelectorAll('.vs-row').length).toBeLessThan(30);
  });

  it('/components/navigation : paginator, stepper linéaire et sidecar', async () => {
    renderAt('/components/navigation');
    await screen.findByRole('heading', { level: 1, name: 'Navigation' });
    const pag = document.getElementById('pagination') as HTMLElement;
    expect(within(pag).getByText('51–75 sur 1284 éléments')).toBeInTheDocument();
    await userEvent.click(within(pag).getAllByRole('button', { name: 'Suivant' })[0] as HTMLElement);
    expect(within(pag).getByText('76–100 sur 1284 éléments')).toBeInTheDocument();
    const stepper = document.getElementById('stepper') as HTMLElement;
    await userEvent.click(within(stepper).getAllByRole('button', { name: 'Suivant' })[0] as HTMLElement);
    await userEvent.click(within(stepper).getAllByRole('button', { name: 'Suivant' })[0] as HTMLElement);
    expect(within(stepper).getByText('La période est requise')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clients' }));
    expect(document.querySelector('.demo-sidecar.open .app-title')?.textContent).toBe('Clients');
  });
});
