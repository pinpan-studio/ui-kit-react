import { useState } from 'react';
import { NavLink } from 'react-router';
import { MaterialIcon } from '../ui/MaterialIcon';
import type { NavConfig, NavItem } from './nav';

interface SidebarProps {
  config: NavConfig;
  isMobile: boolean;
  onClose: () => void;
}

const linkClass =
  (extra: string) =>
  ({ isActive }: { isActive: boolean }) =>
    `menu-item ${extra}${isActive ? ' active' : ''}`;

/** Sidenav « carte flottante » du catalogue : en-tête, recherche, entrées de premier niveau, sections. */
export function Sidebar({ config, isMobile, onClose }: SidebarProps) {
  const [search, setSearch] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(config.groups.filter((g) => g.defaultOpen).map((g) => [g.id, true])),
  );
  const q = search.trim().toLowerCase();
  const matches = (label: string) => !q || label.toLowerCase().includes(q);
  const toggle = (id: string) => setOpenGroups((s) => ({ ...s, [id]: !s[id] }));

  const renderItem = (n: NavItem, extra = '') =>
    matches(n.label) && (
      <NavLink key={n.path} to={n.path} className={linkClass(extra)} end={n.path === '/pages'}>
        <MaterialIcon name={n.icon} className="item-icon" />
        <span className="item-label">{n.label}</span>
        {n.badge ? <span className="count">{n.badge}</span> : null}
      </NavLink>
    );

  return (
    <div className="sidenav-inner">
      <div className="sidenav-header">
        <img src={config.brand.logo} className="brand-logo" alt={config.brand.title} />
        <div className="header-text">
          <span className="app-title">{config.brand.title}</span>
          <span className="app-subtitle">{config.brand.subtitle}</span>
        </div>
        {isMobile && (
          <button
            type="button"
            className="section-header"
            style={{ width: 'auto' }}
            onClick={onClose}
            aria-label="Fermer le menu"
          >
            <MaterialIcon name="chevron_left" />
          </button>
        )}
      </div>

      <div className="nav-search">
        <MaterialIcon name="search" />
        <input
          type="text"
          placeholder="Rechercher une page…"
          aria-label="Rechercher une page"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button type="button" className="clear" onClick={() => setSearch('')} aria-label="Effacer">
            <MaterialIcon name="close" />
          </button>
        )}
      </div>

      <nav
        className="sidenav-menu-wrapper"
        aria-label="Navigation principale"
        onClick={(e) => isMobile && (e.target as HTMLElement).closest('a') && onClose()}
      >
        <div className="menu-section">{config.top.map((n) => renderItem(n, 'top'))}</div>

        {config.groups.map((g) => {
          const visible =
            g.items.some((i) => matches(i.label)) ||
            g.subgroups?.some((s) => s.pages.some((p) => matches(p.label)) || matches(s.label));
          if (!visible) return null;
          const open = !g.collapsible || !!openGroups[g.id] || !!q;
          return (
            <div className="menu-section" key={g.id}>
              {g.collapsible ? (
                <button
                  type="button"
                  className="section-header clickable"
                  aria-expanded={open}
                  onClick={() => toggle(g.id)}
                >
                  <MaterialIcon name={g.icon} className="section-icon" />
                  <span className="section-title">{g.label}</span>
                  <span className="spacer" />
                  <MaterialIcon name="expand_more" className={`chevron${open ? ' open' : ''}`} />
                </button>
              ) : (
                <div className="section-header">
                  <MaterialIcon name={g.icon} className="section-icon" />
                  <span className="section-title">{g.label}</span>
                </div>
              )}
              {open && (
                <div className="section-items">
                  {g.items.map((n) => renderItem(n))}
                  {g.subgroups?.map((s) => {
                    const subOpen = !!openGroups[`${g.id}/${s.id}`] || !!q;
                    return (
                      <div key={s.id}>
                        <button
                          type="button"
                          className="menu-item group-toggle"
                          aria-expanded={subOpen}
                          onClick={() => toggle(`${g.id}/${s.id}`)}
                        >
                          <MaterialIcon name={s.icon} className="item-icon" />
                          <span className="item-label">{s.label}</span>
                          <span className="count">{s.pages.length}</span>
                          <MaterialIcon name="expand_more" className={`chevron small${subOpen ? ' open' : ''}`} />
                        </button>
                        {subOpen && (
                          <div className="sub-items">
                            {s.pages.map(
                              (p) =>
                                (matches(p.label) || matches(s.label)) && (
                                  <NavLink key={p.path} to={p.path} className="menu-item sub" title={p.label} end>
                                    <span className="dot" />
                                    <span className="item-label">{p.label}</span>
                                  </NavLink>
                                ),
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
