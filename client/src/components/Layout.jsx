import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const TITLES = [
  [/^\/dashboard/, 'Dashboard'],
  [/^\/customers\/\d+/, 'Customer Profile'],
  [/^\/customers/, 'Customers'],
  [/^\/agreements\/new/, 'New Agreement'],
  [/^\/calendar/, 'Calendar'],
  [/^\/assignments/, 'Assignments'],
  [/^\/complete-requests/, 'Completion Approvals'],
  [/^\/jobs\/\d+\/card/, 'Job Card'],
  [/^\/jobs\/\d+/, 'Job Detail'],
  [/^\/sms/, 'SMS Centre'],
  [/^\/cancellations/, 'Job Cancellations'],
  [/^\/deleted-jobs/, 'Deleted Jobs'],
  [/^\/users/, 'Users'],
  [/^\/pricing/, 'Pricing'],
  [/^\/technician/, 'My Jobs'],
];

function titleFor(path) {
  const hit = TITLES.find(([re]) => re.test(path));
  return hit ? hit[1] : 'Highcool Service Hub';
}

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="app-shell">
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      <div className={`scrim ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

      <div className="main">
        <header className="topbar">
          <button className="icon-btn" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <h2>{titleFor(pathname)}</h2>
          <div className="spacer" />
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
