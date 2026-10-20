// Extraits de code affichés dans les démos (équivalents React des snippets Angular).
export const CODE = {
  accordion: `
<Accordion className="kit-accordion" expanded={step === 0} onChange={() => setStep(0)}>
  <AccordionSummary expandIcon={<MaterialIcon name="expand_more" />}>
    <span className="pt-title">Informations client</span>
    <span className="pt-desc">Raison sociale, contact</span>
  </AccordionSummary>
  <AccordionDetails>…</AccordionDetails>
  <AccordionActions>
    <Button variant="contained" onClick={next}>Suivant</Button>
  </AccordionActions>
</Accordion>`,
  multi: `
const [open, setOpen] = useState<Set<number>>(new Set());
<Button onClick={() => setOpen(new Set(all))}>Tout déplier</Button>
<Button onClick={() => setOpen(new Set())}>Tout replier</Button>
{panels.map((p, i) => <Accordion expanded={open.has(i)} onChange={() => toggle(i)}>…</Accordion>)}`,
  variants: `
<AccordionSummary expandIcon={…} sx={{ flexDirection: 'row-reverse' }}>…</AccordionSummary>  {/* toggle avant */}
<AccordionSummary>{expanded ? <Icon remove/> : <Icon add/>}</AccordionSummary>          {/* icône perso */}
<Accordion disabled>…</Accordion>
<Accordion slotProps={{ transition: { unmountOnExit: true } }}>…</Accordion>          {/* contenu différé */}`,
  faq: `
<div className="kit-faq">
  {faq.map((item) => (
    <Accordion key={item.q}><AccordionSummary>{item.q}</AccordionSummary><AccordionDetails>{item.a}</AccordionDetails></Accordion>
  ))}
</div>

// SCSS — accordion flat : ni ombre, ni écart à l'ouverture
.kit-faq .MuiAccordion-root { box-shadow: none; margin: 0; background: transparent; }`,
  tree: `
function Node({ node, depth }) {
  const [open, setOpen] = useState(false);
  return (<>
    <div role="treeitem" aria-expanded={open} style={{ paddingLeft: depth * 24 }}>
      <IconButton onClick={() => setOpen(!open)}><MaterialIcon name={open ? 'expand_more' : 'chevron_right'} /></IconButton>
      {node.name}
    </div>
    {open && node.children?.map((c) => <Node node={c} depth={depth + 1} />)}
  </>);
}`,
  dragList: `
<DndContext onDragEnd={({ active, over }) => over && setItems(arrayMove(items, from(active), to(over)))}>
  <SortableContext items={items} strategy={verticalListSortingStrategy}>
    {items.map((it) => <SortableItem key={it} id={it} />)}   {/* useSortable() + poignée */}
  </SortableContext>
</DndContext>`,
  dragKanban: `
<DndContext onDragEnd={drop}>
  {columns.map((c) => <Column id={c.id}>{c.items.map((it) => <Card id={it.id} />)}</Column>)}
</DndContext>

// prédicat : refus de « À faire » → « Terminé »
const drop = ({ active, over }) => { if (from === 'col-todo' && to === 'col-done') return; move(…); };`,
  chips: `
<div className="form-field">
  <label className="field-label">Destinataires</label>
  <div className="field-box chips-box"><MaterialIcon name="alternate_email" />
    {emails.map((e) => <Chip label={e} onDelete={() => remove(e)} onDoubleClick={() => edit(e)} />)}
    <input placeholder="Ajouter…" onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ',') && add()} onBlur={add} />
  </div>
  <span className="field-hint">Entrée ou virgule pour ajouter</span>
</div>`,
  card: `
<Card variant="outlined">
  <CardHeader avatar={<Avatar>TY</Avatar>} title="Transports Yao SARL" subheader="Client depuis 2021 · Abidjan" />
  <CardContent>…</CardContent>
  <CardActions sx={{ justifyContent: 'flex-end' }}>
    <Button>Détails</Button>
    <Button variant="contained">Contacter</Button>
  </CardActions>
</Card>`,
  grid: `
<div className="kit-grid-list" style={{ gridTemplateColumns: \`repeat(\${cols}, 1fr)\`, gridAutoRows: 110, gap: 12 }}>
  {tiles.map((t) => <div style={{ gridColumn: \`span \${t.cols}\`, gridRow: \`span \${t.rows}\` }}>…</div>)}
</div>`,
  sheet: `
<Drawer anchor="bottom" open={open} onClose={() => close(undefined)}>
  <List>{actions.map((a) => <ListItemButton onClick={() => close(a.key)}>…</ListItemButton>)}</List>
</Drawer>`,
  virtual: `
const ITEM = 52;
const first = Math.floor(scrollTop / ITEM);
const visible = rows.slice(first, first + Math.ceil(320 / ITEM) + 4);
<div className="vs-viewport" onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
  <div style={{ height: rows.length * ITEM, position: 'relative' }}>
    <div style={{ transform: \`translateY(\${first * ITEM}px)\` }}>{visible.map(…)}</div>
  </div>
</div>`,
  ripple: `
<ButtonBase className="surface" centerRipple={centered} TouchRippleProps={{ … }}>…</ButtonBase>`,
};
