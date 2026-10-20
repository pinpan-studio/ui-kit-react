// Extraits affichés par « Voir le code » (équivalents React des extraits Angular de buttons-gallery).
export const BUTTONS_CODE = {
  variants: `
<Button variant="contained">Primary</Button>
<Button variant="outlined">Secondary</Button>
<Button variant="outlined" color="inherit">Outline</Button>
<Button variant="text">Ghost</Button>
<Button variant="contained" color="error">Danger</Button>
<Button variant="outlined" color="error">Danger outline</Button>
<Button variant="contained" className="btn-success">Success</Button>`,
  loading: `
<Button variant="contained" disabled={loading} onClick={save}
  startIcon={loading ? <CircularProgress size={18} /> : <MaterialIcon name="save" />}>
  {loading ? 'Enregistrement…' : 'Enregistrer'}
</Button>`,
  icon: `
<Tooltip title="Options"><IconButton className="action-icon-btn"><MaterialIcon name="more_vert" /></IconButton></Tooltip>
<Tooltip title="Rafraîchir"><IconButton className="refresh-btn"><MaterialIcon name="refresh" /></IconButton></Tooltip>`,
  header: `
<div className="page-actions">
  <ViewModeToggle mode={viewMode} onChange={setViewMode} />
  <Tooltip title="Rafraîchir"><IconButton className="refresh-btn"><MaterialIcon name="refresh" /></IconButton></Tooltip>
  <Button variant="contained" disableElevation={false} className="create-btn" startIcon={<MaterialIcon name="add" />}>Nouveau produit</Button>
</div>`,
  segmented: `
<div className="m3-filter-toggle">
  <button type="button" className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>Mois</button>
  <button type="button" className={period === 'year' ? 'active' : ''} onClick={() => setPeriod('year')}>Année</button>
</div>

<div className="chart-tab-toggles">
  <button className={'tab-toggle-btn' + (tab === 'mois' ? ' active' : '')} onClick={() => setTab('mois')}>Mois</button>
  <button className={'tab-toggle-btn' + (tab === 'annee' ? ' active' : '')} onClick={() => setTab('annee')}>Année</button>
</div>`,
  menu: `
<Button variant="outlined" color="inherit" onClick={(e) => setAnchor(e.currentTarget)}
  startIcon={<MaterialIcon name="file_download" />} endIcon={<MaterialIcon name="expand_more" />}>Exporter</Button>
<Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
  <MenuItem><ListItemIcon><MaterialIcon name="table_view" /></ListItemIcon>Excel</MenuItem>
  <MenuItem><ListItemIcon><MaterialIcon name="picture_as_pdf" /></ListItemIcon>PDF</MenuItem>
  <Divider />
  <MenuItem className="menu-danger"><ListItemIcon><MaterialIcon name="delete" /></ListItemIcon>Supprimer</MenuItem>
</Menu>`,
};
