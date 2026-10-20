// Extraits affichés par « Voir le code » (équivalents React des extraits Angular d'interactions.snippets.ts).
export const INTERACTION_SNIPPETS = {
  palette: `
// Enregistrées au montage, retirées au démontage de l'écran
usePaletteCommands(() => [
  { id: 'new-client', label: 'Créer un client', group: 'Actions', icon: 'person_add', shortcut: 'c', keywords: ['nouveau'], action: () => create() },
  { id: 'clients', label: 'Clients', group: 'Navigation', icon: 'group', route: '/clients' },
]);

const { openPalette } = useInteractions();
<button onClick={openPalette}>Rechercher <Kbd keys="mod+k" /></button>`,
  shortcuts: `
useShortcuts(() => [
  { keys: 'c', description: 'Créer un client', group: 'Clients', action: () => create() },
  { keys: 'g c', description: 'Aller aux clients', group: 'Navigation', action: () => navigate('/clients') },
  { keys: 'mod+s', description: 'Enregistrer', allowInInput: true, action: (e) => save() },
]);

<Kbd keys="mod+shift+e" />   // ⌘⇧E sur macOS, Ctrl Maj E ailleurs`,
  popover: `
<Popover position="bottom-start" content={() => <div className="kit-popover">…</div>}>
  <a tabIndex={0}>{client.raison_sociale}</a>
</Popover>

<Popover trigger="click" content={(close) => <div className="kit-popover">… <button onClick={close}>OK</button></div>}>
  <Button variant="outlined">Note rapide</Button>
</Popover>`,
  tour: `
const { startTour } = useInteractions();
startTour([
  { title: 'Bienvenue', content: 'Une courte visite…', icon: 'waving_hand' },
  { target: '#search', title: 'Recherche', content: '⌘K partout.', placement: 'bottom' },
  { target: '#kpis', title: 'Indicateurs', content: 'Vos chiffres du jour.' },
], { onFinish: (completed) => completed && localStorage.setItem('tour-done', '1') });`,
  notifications: `
<NotificationCenter
  notifications={notifs}
  onOpen={(n) => navigate('/alertes/' + n.id)}
  onAction={({ notification, action }) => handle(notification, action)}
/>

// AppNotification : { id, title, message?, at, read?, icon?, tone?, category?, actions?, avatar? }`,
  contextMenu: `
<ContextMenu items={[
  { header: file.name },
  { label: 'Ouvrir', icon: 'open_in_new', shortcut: 'enter', action: () => open(file) },
  { divider: true },
  { label: 'Supprimer', icon: 'delete', danger: true, action: () => remove(file) },
]} onOpen={() => setSelected(file)}>
  <div className="file" tabIndex={0}>{file.name}</div>
</ContextMenu>`,
};
