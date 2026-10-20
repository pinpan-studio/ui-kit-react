/** Extraits de code affichés dans la galerie Feedback (équivalents React des snippets Angular). */
export const CODE = {
  snackbar: `
const snack = useSnackbar();
snack('Client enregistré avec succès', {
  action: 'Fermer',
  duration: 3500,
  panelClass: 'snackbar-success', // snackbar-success | snackbar-error | snackbar-info
});`,
  confirm: `
const open = useDialog();
const ok = await open<boolean>((dialog) => (
  <ConfirmDialog dialog={dialog}
    data={{ title: 'Supprimer le produit', message: '… irréversible.', type: 'danger', confirmLabel: 'Supprimer' }} />
));
if (ok) { /* suppression locale */ }`,
  modal: `
// useModal() — dialogs génériques (équivalent ModalService)
const modal = useModal();
await modal.confirm({ title: 'Valeur', message: 'Voulez-vous supprimer la valeur ?' });
const texte = await modal.prompt({ title: 'Motif de rejet', message: 'Indiquez la raison…' });
modal.alert({ title: 'Compte réinitialisé', message: '…' });
await modal.bottomConfirm({ message: 'Voulez-vous vous déconnecter ?' });`,
  drawer: `
<SideDrawerContainer mode="over" open={open} onClose={() => setOpen(false)}
  drawer={<aside className="right-drawer">…</aside>}>
  <Button variant="contained" onClick={() => setOpen((o) => !o)}>Ouvrir</Button>
</SideDrawerContainer>`,
  skeleton: `
{loading ? <Skeleton variant="card" count={3} /> : …}
{/* variants : line | card | table-row | avatar */}`,
  upload: `
// Envoi réel : progression 0–100, retourne une fonction d'annulation.
const upload: Uploader = (file, { progress, done, error }) => api.upload(file, progress, done, error);

<UploadQueue accept="image/*,application/pdf,.xlsx" maxSize={10 * 1024 * 1024}
  maxFiles={10} concurrency={2} uploader={upload} onCompleted={onDone} />`,
  banner: `
<Banner tone="maintenance" title="Maintenance planifiée" actionLabel="Détails"
  dismissKey="maintenance-2026-10" onAction={openDetails}>
  La plateforme sera indisponible dimanche 19 octobre de 2 h à 4 h.
</Banner>

{/* Dans le layout, une seule fois : */}
<OfflineBanner />`,
  result: `
<Result status="success" title="Paiement confirmé" subtitle="Un reçu a été envoyé par email."
  actions={<>
    <Button variant="outlined">Télécharger le reçu</Button>
    <Button variant="contained">Retour au tableau de bord</Button>
  </>}>
  <div className="receipt">…récapitulatif…</div>
</Result>

<Result status="404" />   {/* 403 · 404 · 500 · error · warning · info · pending */}`,
  undo: `
const undo = useUndo();

function remove(item: Item) {
  const before = items;
  setItems(before.filter((i) => i !== item));            // mise à jour optimiste
  undo.run({
    message: \`« \${item.nom} » supprimé\`,
    undo: () => setItems(before),                         // clic sur « Annuler »
    commit: () => api.delete(item.id),                    // après 5 s sans annulation
  });
}`,
};
