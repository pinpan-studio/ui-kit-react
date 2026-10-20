// Extraits de code affichés dans les démos de la galerie Navigation (équivalents React).
export const CODE = {
  header: `
<Toolbar className="shell-toolbar">
  <IconButton onClick={toggleDrawer}><MaterialIcon name="menu" /></IconButton>
  <span className="page-title">{pageTitle}</span>
  <span className="spacer" />
  <IconButton onClick={toggleTheme}><MaterialIcon name="dark_mode" /></IconButton>
  <IconButton><Badge badgeContent={7} color="primary"><MaterialIcon name="checklist" /></Badge></IconButton>
  <IconButton><Badge badgeContent={3} color="error"><MaterialIcon name="notifications" /></Badge></IconButton>
  <IconButton className="avatar-btn"><div className="avatar">JK</div></IconButton>
</Toolbar>`,
  sidecar: `
<nav className={\`sidecar\${openModule ? ' open' : ''}\`}>
  <div className="sidecar-rail">
    {menuItems.map((item) => (
      <Tooltip key={item._id} title={item.libelle} placement="right">
        <button className={\`nav-rail-item\${openModule?._id === item._id ? ' active' : ''}\`} onClick={() => toggle(item)}>
          <MaterialIcon name={item.icon} />
        </button>
      </Tooltip>
    ))}
  </div>
  <div className="sidecar-panel">
    {openModule && (<>
      <div className="sidenav-header">…<IconButton onClick={() => setOpenModule(null)}><MaterialIcon name="chevron_left" /></IconButton></div>
      <div className="sidenav-menu-wrapper">
        {openModule.children.map((child) => (
          <NavLink className="menu-item" to={child.path}><MaterialIcon name={child.icon} className="item-icon" />…</NavLink>
        ))}
      </div>
    </>)}
  </div>
</nav>`,
  pageHeader: `
<div className="page-header">
  <div className="page-title-area">
    <div className="title-row">
      <IconButton className="drawer-toggle-btn"><MaterialIcon name="menu" /></IconButton>
      <div>
        <h1>Registre des Produits</h1>
        <p>Catalogue des offres — 24 produit(s)</p>
      </div>
    </div>
  </div>
  <div className="page-actions">…</div>
</div>`,
  paginator: `
<Paginator
  total={total} page={page} itemPerPage={pageSize}
  pageSizeOptions={[10, 25, 50, 100]}
  onPageChange={setPage}
  onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
/>`,
  breadcrumb: `
<div className="breadcrumb">SC REGISTRY / CONTRATS</div>
<h1>Contrat CTR-2026-0042</h1>`,
};
