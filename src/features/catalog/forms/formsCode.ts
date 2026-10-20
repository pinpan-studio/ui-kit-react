/** Extraits de code de la galerie Formulaires (équivalents React des snippets Angular). */
export const CODE = {
  fieldBox: `
<div className="form-field">
  <label className="field-label">Raison sociale</label>
  <div className="field-box">
    <MaterialIcon name="business" />
    <input placeholder="Ex : Transports Yao & Fils" />
  </div>
</div>`,
  fieldError: `
<div className="field-box field-invalid">…</div>
<span className="field-error">Adresse email invalide</span>`,
  matOutline: `
<TextField className="kit-outline-field" variant="outlined" label="Nom complet"
  helperText="Affiché sur les documents"
  slotProps={{ input: { endAdornment: <MaterialIcon name="person" /> } }} />`,
  textarea: `
<div className="field-box textarea-box">
  <textarea rows={3} placeholder="Décrivez la demande…" />
</div>`,
  matSelect: `
<div className="field-box select-box">
  <MaterialIcon name="location_on" />
  <BoxSelect value={ville} onChange={setVille} options={VILLE_OPTIONS} />
</div>`,
  searchable: `
<SearchableSelect options={priorityOptions} value={priorite} onChange={setPriorite}
  placeholder="Priorité…" icon="flag" clearable />`,
  multi: `
<BoxSelect multiple value={zones} onChange={setZones} options={VILLE_OPTIONS}
  placeholder="Choisir des villes" />`,
  autocomplete: `
<EntityAutocomplete placeholder="Rechercher un client…" icon="business"
  searchFn={(q) => api.searchClients(q)}           // Promise<Client[]>
  displayFn={(c) => \`\${c.code} — \${c.raison_sociale}\`}
  onItemSelected={setClient} />`,
  date: `
<FieldBoxDate value={date} onChange={setDate} />          // calendrier mat-calendar
<Calendar selected={date} onSelect={setDate} />           // calendrier inline`,
  range: `
<FieldBoxDateRange value={{ start, end }} onChange={({ start, end }) => …} />`,
  time: `
<FieldBoxTime value={heure} onChange={setHeure} intervalMin={15} />`,
  checkbox: `<FormControlLabel control={<Checkbox checked={sms} onChange={…} />} label="SMS" />`,
  radio: `
<RadioGroup value={periodicite} onChange={(e) => setPeriodicite(e.target.value)}>
  <FormControlLabel value="MENSUEL" control={<Radio />} label="Mensuel" />
</RadioGroup>`,
  toggle: `<FormControlLabel control={<Switch checked={actif} onChange={…} />} label="Client actif" />`,
  mask: `
<MaskedInput mask="+225 00 00 00 00 00" value={tel} onValueChange={setTel} />
// 0 = chiffre, A = lettre, * = alphanumérique, autres caractères insérés automatiquement`,
  upload: `
<FileUpload placeholder="Joindre un document" accept="application/pdf" onUpload={setFichier} />
<FileUpload mode="photo" accept="image/*" fichier={photo} onUpload={setPhoto} />`,
  search: `
<div className="toolbar-search-filters">
  <div className="m3-search-bar-unified">
    <div className="search-input-wrapper">…</div>
    <div className="divider" />
    <FilterDropdown options={statutOptions} value={statut} onChange={setStatut} labelPrefix="Statut" />
  </div>
</div>`,
  validation: `
const errors = validate(values);                 // required, email, pattern, min/max
const show = (k) => !!errors[k] && (touched.has(k) || submitted);
<div className={\`field-box\${show('email') ? ' field-invalid' : ''}\`}>…</div>
{show('email') && <span className="field-error">Adresse email invalide</span>}`,
  crud: `
const open = useDialog();
const saved = await open((dialog) => (
  <CrudDialog dialog={dialog} config={{
    title: 'Nouveau client', mode: 'create',
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'ville', label: 'Ville', type: 'select', options: VILLE_OPTIONS },
      { key: 'gestionnaire', label: 'Gestionnaire', type: 'autocomplete', options: [...] },
    ],
  }} />
), { width: '700px', panelClass: 'assac-dialog-panel' });`,
};
