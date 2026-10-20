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

  it('/components/feedback : alerte fermable, ConfirmDialog (résultat) et page de résultat', async () => {
    renderAt('/components/feedback');
    await screen.findByRole('heading', { level: 1, name: 'Feedback' });
    const alert = document.getElementById('alert') as HTMLElement;
    await userEvent.click(within(alert).getAllByRole('button', { name: 'Fermer' })[0] as HTMLElement);
    expect(within(alert).queryByText('Synchronisation planifiée')).not.toBeInTheDocument();
    const dlg = document.getElementById('dialog') as HTMLElement;
    await userEvent.click(within(dlg).getByRole('button', { name: /Danger/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Supprimer' }));
    expect(await within(dlg).findByText('résultat : Confirmé')).toBeInTheDocument();
    const res = document.getElementById('result') as HTMLElement;
    await userEvent.click(within(res).getByRole('button', { name: '404', hidden: true }));
    expect(within(res).getByText('Page introuvable')).toBeInTheDocument();
  });
  it('/components/forms : masque, sélecteur recherchable, filtre et validation', async () => {
    renderAt('/components/forms');
    await screen.findByRole('heading', { level: 1, name: 'Formulaires' });
    const mask = document.getElementById('mask') as HTMLElement;
    await userEvent.type(within(mask).getByLabelText('Immatriculation'), '1234ab01');
    expect(within(mask).getByText('Valeur : 1234 AB 01')).toBeInTheDocument();
    const sel = document.getElementById('select') as HTMLElement;
    await userEvent.click(within(sel).getByText('Normale'));
    const panel = document.querySelector('.pq-fs-panel') as HTMLElement;
    await userEvent.type(within(panel).getByPlaceholderText('Rechercher…'), 'crit');
    await userEvent.click(within(panel).getByRole('button', { name: /Critique/ }));
    expect(within(sel).getByText('Critique')).toBeInTheDocument();
    const val = document.getElementById('validation') as HTMLElement;
    await userEvent.click(within(val).getByRole('button', { name: /Enregistrer/ }));
    expect(within(val).getByText('La raison sociale est requise')).toBeInTheDocument();
    expect(within(val).getByText('Champs requis manquants')).toBeInTheDocument();
  });

  it('/components/fields : stepper, arborescence, transfert et validation du PV', async () => {
    renderAt('/components/fields');
    await screen.findByRole('heading', { level: 1, name: 'Champs avancés' });
    const stepper = document.getElementById('stepper') as HTMLElement;
    expect(within(stepper).getByText('Entre 1 et 500 · valeur : 12')).toBeInTheDocument();
    await userEvent.click(within(stepper).getAllByRole('button', { name: /Augmenter/ })[0] as HTMLElement);
    expect(within(stepper).getByText('Entre 1 et 500 · valeur : 13')).toBeInTheDocument();
    const tree = document.getElementById('tree-select') as HTMLElement;
    expect(within(tree).getByText('Abidjan › Abidjan Sud › Marcory')).toBeInTheDocument();
    const transfer = document.getElementById('transfer') as HTMLElement;
    await userEvent.dblClick(within(transfer).getByText('CI-4521-AB'));
    expect(within(transfer).getByText('Ordre de tournée : CI-2210-CD → CI-1150-LM → CI-4521-AB')).toBeInTheDocument();
    const form = document.getElementById('form') as HTMLElement;
    await userEvent.click(within(form).getByRole('button', { name: /Valider le PV/ }));
    expect(within(form).getByText('Choisissez un quartier')).toBeInTheDocument();
    expect(within(form).getByText('Champs requis manquants')).toBeInTheDocument();
  });
});
