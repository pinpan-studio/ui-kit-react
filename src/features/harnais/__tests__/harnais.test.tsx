import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HARNAIS_SUGGESTIONS, type HarnaisWidget } from '../../../data/static/harnais.data';
import { renderAt } from '../../../test/renderApp';
import { HzCarousel } from '../widgets/HzCarousel';
import { HzForm } from '../widgets/HzForm';
import { HzTable } from '../widgets/HzTable';
import { HzTree } from '../widgets/HzTree';

describe('Harnais : page', () => {
  it('affiche l’accueil (salutation, saisie, suggestions) sur /harnais', async () => {
    renderAt('/harnais');
    expect(await screen.findByRole('heading', { level: 1, name: 'Nouvelle conversation' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /^(Bonjour|Bonsoir), Jean$/ })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Comment puis-je vous aider aujourd'hui ?")).toBeInTheDocument();
  });

  it('remplit la saisie au clic sur une suggestion', async () => {
    renderAt('/harnais');
    const s = HARNAIS_SUGGESTIONS[0] ?? { label: '', prompt: '' };
    await userEvent.click(await screen.findByRole('button', { name: new RegExp(s.label) }));
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue(s.prompt);
  });

  it('ouvre une conversation existante depuis l’URL et bascule le panneau latéral', async () => {
    renderAt('/harnais/c-sidecar');
    expect(await screen.findByRole('heading', { level: 1, name: 'Sidecar de navigation Angular' })).toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'Artefacts, contexte et tâches' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('retombe sur l’accueil pour un identifiant inconnu (pas d’écran d’erreur, comme Angular)', async () => {
    renderAt('/harnais/inconnu');
    expect(await screen.findByRole('heading', { level: 1, name: 'Nouvelle conversation' })).toBeInTheDocument();
  });

  it('⌘K / Ctrl+K revient à une nouvelle conversation', async () => {
    const { router } = renderAt('/harnais/c-sidecar');
    await screen.findByRole('heading', { level: 1, name: 'Sidecar de navigation Angular' });
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    await waitFor(() => expect(router.state.location.pathname).toBe('/harnais'));
    expect(await screen.findByText('Nouvelle conversation', { selector: 'h1' })).toBeInTheDocument(); // Le raccourci global mod+k (palette de commandes) ne doit pas s'ouvrir en plus.
    expect(screen.queryByRole('dialog', { name: 'Palette de commandes' })).not.toBeInTheDocument();
  });

  it('hors Harnais, Ctrl+K ouvre la palette, sans « Aucun résultat » tant que la recherche est vide', async () => {
    renderAt('/ui-showcase');
    await screen.findAllByRole('heading', { level: 1 });
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(await screen.findByRole('dialog', { name: 'Palette de commandes' })).toBeInTheDocument();
    expect(screen.queryByText('Aucun résultat')).not.toBeInTheDocument();
  });
});

type TableBlock = Extract<HarnaisWidget, { type: 'table' }>;
const table: TableBlock = {
  type: 'table',
  searchable: true,
  pageSize: 2,
  columns: [
    { key: 'nom', label: 'Nom' },
    { key: 'qte', label: 'Quantité', kind: 'number' },
  ],
  rows: [
    { nom: 'Bravo', qte: 2 },
    { nom: 'Alpha', qte: 30 },
    { nom: 'Charlie', qte: 10 },
  ],
} as TableBlock;

describe('Harnais : widgets', () => {
  it('HzTable : tri, filtre et pagination', async () => {
    render(<HzTable block={table} />);
    expect(screen.getByText('1–2 sur 3')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Nom/ }));
    const rows = () =>
      screen
        .getAllByRole('row')
        .slice(1)
        .map((r) => within(r).getAllByRole('cell')[0]?.textContent);
    expect(rows()).toEqual(['Alpha', 'Bravo']);
    expect(screen.getByRole('columnheader', { name: /Nom/ })).toHaveAttribute('aria-sort', 'ascending');
    await userEvent.click(screen.getByRole('button', { name: 'Page suivante' }));
    expect(rows()).toEqual(['Charlie']);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Filtrer le tableau' }), 'zzz');
    expect(screen.getByText(/Aucune ligne ne correspond/)).toBeInTheDocument();
  });

  it('HzTree : déplier / replier et sélection tri-état', async () => {
    const onSubmit = vi.fn();
    render(
      <HzTree
        selectable
        onSubmit={onSubmit}
        nodes={[
          {
            id: 'a',
            label: 'Dossier',
            children: [
              { id: 'b', label: 'Fichier 1' },
              { id: 'c', label: 'Fichier 2' },
            ],
          },
        ]}
      />,
    );
    expect(screen.queryByText('Fichier 1')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Basculer Dossier' }));
    expect(screen.getByText('Fichier 1')).toBeInTheDocument();
    const boxes = screen.getAllByRole('checkbox');
    await userEvent.click(boxes[1] as HTMLElement);
    expect(screen.getByText('1 / 2 sélectionné(s)')).toBeInTheDocument();
    expect(boxes[0]).toHaveAttribute('data-indeterminate', 'true');
    await userEvent.click(screen.getByRole('button', { name: /Valider la sélection/ }));
    expect(onSubmit).toHaveBeenCalledWith(['Fichier 1']);
  });

  it('HzCarousel : flèches et clavier', async () => {
    render(<HzCarousel slides={[{ title: 'Un' }, { title: 'Deux' }, { title: 'Trois' }]} />);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Précédent' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('region'), { key: 'ArrowRight' });
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('HzForm : champ requis, puis envoi des valeurs', async () => {
    const onSubmit = vi.fn();
    const block = {
      type: 'form',
      fields: [
        { key: 'nom', label: 'Nom', kind: 'text', required: true },
        { key: 'mail', label: 'E-mail', kind: 'email' },
      ],
    } as Extract<HarnaisWidget, { type: 'form' }>;
    render(<HzForm block={block} onSubmit={onSubmit} />);
    // Comme mat-form-field : astérisque sur le champ requis, libellé dans le champ (non remonté) tant qu'il est vide.
    const nom = screen.getByRole('textbox', { name: /^Nom/ }).closest('.MuiFormControl-root');
    expect(nom?.querySelector('.MuiFormLabel-asterisk')).toBeInTheDocument();
    expect(nom?.querySelector('label')).toHaveAttribute('data-shrink', 'false');
    await userEvent.click(screen.getByRole('button', { name: /Envoyer/ }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Champ requis')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox', { name: /Nom/ }), 'Awa');
    await userEvent.type(screen.getByRole('textbox', { name: /E-mail/ }), 'pas-un-mail');
    await userEvent.click(screen.getByRole('button', { name: /Envoyer/ }));
    expect(screen.getByText('Adresse invalide')).toBeInTheDocument();
    await userEvent.clear(screen.getByRole('textbox', { name: /E-mail/ }));
    await userEvent.type(screen.getByRole('textbox', { name: /E-mail/ }), 'awa@example.com');
    await userEvent.click(screen.getByRole('button', { name: /Envoyer/ }));
    expect(onSubmit).toHaveBeenCalledWith({ nom: 'Awa', mail: 'awa@example.com' });
  });

  it('HzForm : champs à masque et autocomplétion au style mat-form-field (libellé dans le champ tant que vide)', async () => {
    const block = {
      type: 'form',
      fields: [
        { key: 'tel', label: 'Téléphone', kind: 'mask', icon: 'call', mask: '+225 00 00', placeholder: '+225 07' },
        {
          key: 'ville',
          label: 'Ville',
          kind: 'autocomplete',
          icon: 'location_city',
          options: [{ value: 'Abidjan', label: 'Abidjan' }],
        },
      ],
    } as Extract<HarnaisWidget, { type: 'form' }>;
    render(<HzForm block={block} onSubmit={vi.fn()} />);
    const tel = screen.getByRole('textbox', { name: /^Téléphone/ });
    const ville = screen.getByRole('combobox', { name: /^Ville/ });
    const labelOf = (el: HTMLElement) => el.closest('.MuiFormControl-root')?.querySelector('label');
    expect(labelOf(tel)).toHaveAttribute('data-shrink', 'false');
    expect(labelOf(ville)).toHaveAttribute('data-shrink', 'false');
    await userEvent.click(tel);
    expect(labelOf(tel)).toHaveAttribute('data-shrink', 'true');
    await userEvent.click(ville);
    expect(labelOf(ville)).toHaveAttribute('data-shrink', 'true');
    expect(labelOf(tel)).toHaveAttribute('data-shrink', 'false');
  });
});
