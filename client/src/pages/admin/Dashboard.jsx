import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../../auth/AuthContext';
import { jobsApi } from '../../api/jobs.api';
import { listContainer, listItem, tap } from '../../lib/motion';

const STAT_DEFS = [
  { key: 'customers', label: 'Customers', tone: 'brand', to: '/customers', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8' },
  { key: 'activeAgreements', label: 'Active Agreements', tone: 'blue', to: '/customers', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8' },
  { key: 'upcoming', label: 'Upcoming Visits', tone: 'amber', to: '/calendar', icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' },
  { key: 'pendingApprovals', label: 'Pending Approvals', tone: 'pink', to: '/calendar', icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
  { key: 'completedThisMonth', label: 'Completed (Month)', tone: 'green', to: '/calendar', icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3' },
];

const ACTIONS = [
  { to: '/agreements/new', title: 'New Agreement', desc: 'Register a customer, AC unit & service plan', icon: 'M12 5v14M5 12h14' },
  { to: '/customers', title: 'Find a Customer', desc: 'Search by NIC, phone, name or AS- number', icon: 'M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z' },
  { to: '/calendar', title: 'Calendar', desc: "See this month's scheduled visits", icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' },
  { to: '/cancellations', title: 'Cancellations', desc: 'Review cancelled service visits', icon: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9l-6 6M9 9l6 6' },
];

const Svg = ({ d, size = 22 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {d.split('M').filter(Boolean).map((p, i) => <path key={i} d={`M${p}`} />)}
  </svg>
);

function fmtDate(s) {
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);

  useEffect(() => {
    jobsApi.stats().then(({ stats }) => setStats(stats)).catch(() => {});
    jobsApi.upcoming(6).then(({ jobs }) => setUpcoming(jobs)).catch(() => {});
  }, []);

  return (
    <>
      <div className="card hero-card">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0]}.</h1>
          <p>Your service operations at a glance — pick up where you left off.</p>
        </div>
        <motion.button {...tap} onClick={() => navigate('/agreements/new')}>+ New Agreement</motion.button>
      </div>

      <motion.div className="stats-grid" variants={listContainer} initial="hidden" animate="visible">
        {STAT_DEFS.map((s) => (
          <motion.button key={s.key} type="button" className="stat-tile" variants={listItem}
            whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} onClick={() => navigate(s.to)}>
            <span className={`stat-icon tone-${s.tone}`}><Svg d={s.icon} size={18} /></span>
            <div className="stat-num">{stats ? stats[s.key] : '—'}</div>
            <div className="stat-label">{s.label}</div>
            <span className="stat-go" aria-hidden="true">→</span>
          </motion.button>
        ))}
      </motion.div>

      <div className="dash-section">
        <h2 className="section-h">Quick actions</h2>
        <motion.div className="dash-actions" variants={listContainer} initial="hidden" animate="visible">
          {ACTIONS.map((a) => (
            <motion.button key={a.to} className="quick-card" variants={listItem} {...tap} onClick={() => navigate(a.to)}>
              <span className="quick-icon"><Svg d={a.icon} /></span>
              <span className="quick-title">{a.title}</span>
              <span className="quick-desc">{a.desc}</span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      <div className="card upcoming-card">
        <div className="row-between">
          <div className="card-title"><h2>Upcoming Visits</h2><span className="count">{upcoming.length}</span></div>
          <button className="link" onClick={() => navigate('/calendar')}>Calendar →</button>
        </div>
        <div className="upcoming-list">
          {upcoming.map((j) => (
            <button key={j.id} className="up-item" onClick={() => navigate(`/jobs/${j.id}`)}>
              <span className="up-date">
                <b>{new Date(j.scheduled_date + 'T00:00:00').getDate()}</b>
                <i>{new Date(j.scheduled_date + 'T00:00:00').toLocaleDateString('en', { month: 'short' })}</i>
              </span>
              <span className="up-body">
                <span className="up-name">{j.customer_name}</span>
                <span className="up-meta"><span className="mono">{j.agreement_no}</span> · {j.route || 'No route'}</span>
              </span>
              <span className="up-day">{fmtDate(j.scheduled_date).split(',')[0]}</span>
            </button>
          ))}
          {upcoming.length === 0 && <p className="muted" style={{ padding: '8px 0' }}>No upcoming visits scheduled.</p>}
        </div>
      </div>
    </>
  );
}
