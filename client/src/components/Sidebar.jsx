import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../auth/AuthContext';

/* Minimal inline icon set (stroke, 24-grid) — no external dependency. */
const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);
const ICONS = {
  dashboard: 'M4 13h6V4H4zM14 20h6v-9h-6zM14 8h6V4h-6zM4 20h6v-4H4z',
  customers: ['M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'M22 20v-1a4 4 0 0 0-3-3.87', 'M16 3.13A4 4 0 0 1 16 11'],
  add: ['M12 5v14', 'M5 12h14'],
  calendar: ['M8 2v4', 'M16 2v4', 'M3 10h18', 'M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],
  cancel: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M15 9l-6 6', 'M9 9l6 6'],
  trash: ['M3 6h18', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6'],
  users: ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  price: ['M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z', 'M7 7h.01'],
  jobs: ['M20 7h-3V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v3H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z'],
};

const NAV = {
  office: [
    { label: 'Operations', items: [
      { to: '/dashboard', icon: 'dashboard', name: 'Dashboard' },
      { to: '/customers', icon: 'customers', name: 'Customers' },
      { to: '/agreements/new', icon: 'add', name: 'New Agreement' },
    ] },
    { label: 'Scheduling', items: [
      { to: '/calendar', icon: 'calendar', name: 'Calendar' },
      { to: '/cancellations', icon: 'cancel', name: 'Cancellations' },
      { to: '/deleted-jobs', icon: 'trash', name: 'Deleted Jobs' },
    ] },
  ],
  admin: [
    { label: 'Administration', items: [
      { to: '/users', icon: 'users', name: 'Users' },
      { to: '/pricing', icon: 'price', name: 'Pricing' },
    ] },
  ],
  technician: [
    { label: 'Work', items: [
      { to: '/technician', icon: 'jobs', name: 'My Jobs' },
    ] },
  ],
};

export default function Sidebar({ open, onNavigate }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTech = user?.role === 'technician';

  const groups = isTech ? NAV.technician : [...NAV.office, ...(isAdmin ? NAV.admin : [])];
  const initials = (user?.name || '?').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-mark">H</div>
        <div>
          <div className="brand-name">Highcool</div>
          <div className="brand-sub">Service Hub</div>
        </div>
      </div>

      <nav className="nav-scroll">
        {groups.map((group) => (
          <div className="nav-group" key={group.label}>
            <div className="nav-group-label">{group.label}</div>
            {group.items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                onClick={onNavigate}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon d={ICONS[it.icon]} />
                <span>{it.name}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="sidebar-user">
          <div className="avatar">{initials}</div>
          <div className="who">
            <div className="n">{user?.name}</div>
            <div className="r">{user?.role?.replace('_', ' ')}</div>
          </div>
          <motion.button className="link" style={{ color: 'var(--rail-ink)' }}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={logout} title="Sign out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
            </svg>
          </motion.button>
        </div>
      </div>
    </aside>
  );
}
