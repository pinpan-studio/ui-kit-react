import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from '../../test/renderApp';
import { ContextMenu } from './ContextMenu';
import { NotificationCenter, type AppNotification } from './NotificationCenter';
import { paletteRows } from './paletteRows';
import type { PaletteCommand } from './types';

const CMDS: PaletteCommand[] = [
  { id: 'a', label: 'Créer un client', group: 'Actions' },
  { id: 'b', label: 'Boutons', group: 'Composants', hint: 'Primary, ghost, danger' },
  { id: 'c', label: 'Exporter les trajets', group: 'Actions' },
];

describe('paletteRows (recherche approchée)', () => {
  it('sans requête : récents d’abord puis groupes', () => {
    const rows = paletteRows(CMDS, ['c'], '');
    expect(rows.map((r) => [r.cmd.id, r.group])).toEqual([
      ['c', 'Récents'],
      ['a', 'Actions'],
      ['b', 'Composants'],
    ]);
  });
  it('trouve « Créer un client » avec « clt » sans accents et via les mots-clés', () => {
    expect(paletteRows(CMDS, [], 'clt')[0]?.cmd.id).toBe('a');
    expect(paletteRows(CMDS, [], 'creer').map((r) => r.cmd.id)).toContain('a');
    expect(paletteRows(CMDS, [], 'danger').map((r) => r.cmd.id)).toEqual(['b']);
    expect(paletteRows(CMDS, [], 'zzzz')).toEqual([]);
  });
});

describe('Palette ⌘K / raccourcis (shell du catalogue)', () => {
  it('Ctrl+K ouvre la palette, filtre, ↓ / Entrée navigue vers la page', async () => {
    const { router } = renderAt('/components');
    await screen.findByRole('heading', { level: 1, name: 'Composants' });
    fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true });
    const input = await screen.findByRole('combobox', { name: 'Rechercher une commande' });
    await userEvent.type(input, 'interactions');
    const dialog = screen.getByRole('dialog', { name: 'Palette de commandes' });
    expect(within(dialog).getAllByRole('option')[0]).toHaveTextContent('Interactions');
    await userEvent.keyboard('{Enter}');
    await screen.findByRole('heading', { level: 1, name: 'Interactions' });
    expect(router.state.location.pathname).toBe('/components/interactions');
    expect(JSON.parse(localStorage.getItem('kit-palette-recent') ?? '[]')).toEqual(['nav-/components/interactions']);
  });

  it('le bouton Rechercher ouvre la palette ; « ? » ouvre l’aide ; séquence « g c » journalisée', async () => {
    renderAt('/components/interactions');
    await screen.findByRole('heading', { level: 1, name: 'Interactions' });
    await userEvent.click(screen.getByRole('button', { name: 'Rechercher (⌘K)' }));
    expect(await screen.findByRole('dialog', { name: 'Palette de commandes' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');

    fireEvent.keyDown(document.body, { key: 'g' });
    fireEvent.keyDown(document.body, { key: 'c' });
    expect(await screen.findByText(/G puis C → Aller aux clients/)).toBeInTheDocument();

    fireEvent.keyDown(document.body, { key: '?', shiftKey: true });
    const help = await screen.findByRole('dialog', { name: 'Raccourcis clavier' });
    expect(within(help).getByText('Galerie Interactions')).toBeInTheDocument();
    expect(within(help).getByText('Ouvrir la palette de commandes')).toBeInTheDocument();
  });
});

describe('NotificationCenter', () => {
  const now = new Date();
  const N: AppNotification[] = [
    { id: '1', title: 'Paiement reçu', at: now, category: 'Finance' },
    { id: '2', title: 'Mention', at: now, category: 'Équipe' },
    { id: '3', title: 'Ancienne', at: new Date(Date.now() - 5 * 864e5), read: true, category: 'Finance' },
  ];
  it('compteur, onglets, marquer lu, tout marquer, suppression', async () => {
    render(<NotificationCenter notifications={N} />);
    const bell = screen.getByRole('button', { name: 'Notifications, 2 non lues' });
    await userEvent.click(bell);
    const panel = await screen.findByRole('dialog', { name: 'Notifications' });
    expect(within(panel).getByText('Aujourd’hui')).toBeInTheDocument();
    expect(within(panel).getByText('Plus ancien')).toBeInTheDocument();

    await userEvent.click(within(panel).getByRole('tab', { name: /Non lues/ }));
    expect(within(panel).queryByText('Ancienne')).not.toBeInTheDocument();
    await userEvent.click(within(panel).getByText('Paiement reçu'));
    expect(screen.getByRole('button', { name: 'Notifications, 1 non lues' })).toBeInTheDocument();

    await userEvent.click(within(panel).getByRole('button', { name: 'Tout marquer comme lu' }));
    expect(within(panel).getByText('Vous êtes à jour')).toBeInTheDocument();

    await userEvent.click(within(panel).getByRole('tab', { name: 'Toutes' }));
    await userEvent.click(within(panel).getAllByRole('button', { name: 'Supprimer' })[0] as HTMLElement);
    expect(within(panel).getAllByRole('button', { name: 'Supprimer' })).toHaveLength(2);
  });
});

describe('ContextMenu', () => {
  it('clic droit ouvre le menu au curseur ; ↓ ignore titres / désactivés ; Entrée exécute', async () => {
    const ran: string[] = [];
    render(
      <ContextMenu
        items={[
          { header: 'Fichier' },
          { label: 'Ouvrir', action: () => ran.push('ouvrir') },
          { label: 'Bloqué', disabled: true },
          { divider: true },
          { label: 'Supprimer', danger: true, action: () => ran.push('supprimer') },
        ]}
      >
        <div tabIndex={0}>cible</div>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByText('cible'), { clientX: 20, clientY: 30 });
    const menu = await screen.findByRole('menu');
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(within(menu).getByRole('menuitem', { name: 'Supprimer' })).toHaveClass('active');
    fireEvent.keyDown(menu, { key: 'Enter' });
    expect(ran).toEqual(['supprimer']);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
