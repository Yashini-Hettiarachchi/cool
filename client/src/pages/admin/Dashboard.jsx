import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../auth/AuthContext';
import { jobsApi } from '../../api/jobs.api';
import { listContainer, listItem, tap } from '../../lib/motion';
import Pagination, { paginate } from '../../components/Pagination';

const CHEVRON_R = 'M9 18l6-6-6-6';
const PER_PAGE = 5;

/* KPIs — the numbers a manager scans first. "Needs attention" ones lead. */
const STAT_DEFS = [
  { key: 'pendingApprovals', label: 'Pending Approvals', tone: 'pink', to: '/complete-requests', accent: true, icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
  { key: 'upcoming', label: 'Upcoming Visits', tone: 'amber', to: '/calendar', icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' },
  { key: 'activeAgreements', label: 'Active Agreements', tone: 'blue', to: '/customers', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8' },
  { key: 'customers', label: 'Customers', tone: 'brand', to: '/customers', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8' },
  { key: 'completedThisMonth', label: 'Completed (Month)', tone: 'green', to: '/calendar', icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3' },
];

/* Compact shortcuts (New Agreement is the hero CTA, so it's not repeated here) */
const ACTIONS = [
  { to: '/customers', title: 'Find a Customer', icon: 'M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z' },
  { to: '/assignments', title: 'Assign Technicians', icon: 'M20 7h-3V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v3H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z' },
  { to: '/calendar', title: 'Open Calendar', icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' },
  { to: '/cancellations', title: 'Review Cancellations', icon: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9l-6 6M9 9l6 6' },
];

const Svg = ({ d, size = 22 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {(d || '').split('M').filter(Boolean).map((p, i) => <path key={i} d={`M${p}`} />)}
  </svg>
);

function fmtDay(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    jobsApi.stats().then(({ stats }) => setStats(stats)).catch(() => {});
    jobsApi.upcoming(60).then(({ jobs }) => setUpcoming(jobs)).catch(() => {});
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const pg = paginate(upcoming, page, PER_PAGE);

  return (
    <>
      {/* Greeting — light & compact */}
      <div className="dash-greet">
        <div>
          <h1>{greeting}, {user?.name?.split(' ')[0]}.</h1>
          <p className="muted">Here's your service operation at a glance.</p>
        </div>
        <motion.button {...tap} className="primary" onClick={() => navigate('/agreements/new')}>
          <Svg d="M12 5v14M5 12h14" size={16} /> New Agreement
        </motion.button>
      </div>

      {/* KPI row */}
      <motion.div className="kpi-grid" variants={listContainer} initial="hidden" animate="visible">
        {STAT_DEFS.map((s) => {
          const val = stats ? stats[s.key] : null;
          const highlight = s.accent && val > 0;
          return (
            <motion.button key={s.key} type="button" className={`kpi-tile tone-${s.tone}${highlight ? ' attention' : ''}`}
              variants={listItem} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} onClick={() => navigate(s.to)}>
              <span className={`kpi-icon tone-${s.tone}`}><Svg d={s.icon} size={20} /></span>
              <span className="kpi-body">
                <span className="kpi-num">{val ?? '—'}</span>
                <span className="kpi-label">{s.label}</span>
              </span>
              <span className="kpi-go" aria-hidden="true"><Svg d={CHEVRON_R} size={15} /></span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Two columns: Upcoming (main) + Quick actions (side) */}
      <div className="dash-cols">
        <div className="card upcoming-card">
          <div className="row-between">
            <div className="card-title"><h2>Upcoming Visits</h2><span className="count">{upcoming.length}</span></div>
            <motion.button {...tap} className="pill-link" onClick={() => navigate('/calendar')}>
              Calendar <span className="pl-arrow"><Svg d={CHEVRON_R} size={14} /></span>
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div className="upcoming-list" key={page}
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18 }}>
              {pg.slice.map((j) => (
                <button key={j.id} className="up-item" onClick={() => navigate(`/jobs/${j.id}`)}>
                  <span className="up-date">
                    <b>{new Date(j.scheduled_date + 'T00:00:00').getDate()}</b>
                    <i>{new Date(j.scheduled_date + 'T00:00:00').toLocaleDateString('en', { month: 'short' })}</i>
                  </span>
                  <span className="up-body">
                    <span className="up-name">{j.customer_name}</span>
                    <span className="up-meta"><span className="mono">{j.agreement_no}</span> · {j.route || 'No route'}</span>
                  </span>
                  <span className="up-day">{fmtDay(j.scheduled_date)}</span>
                </button>
              ))}
              {upcoming.length === 0 && <p className="muted" style={{ padding: '8px 0' }}>No upcoming visits scheduled.</p>}
            </motion.div>
          </AnimatePresence>

          <Pagination {...pg} onPage={setPage} unit="visits" />
        </div>

        <div className="card quick-panel">
          <h2 className="section-h">Quick actions</h2>
          <motion.div className="quick-list" variants={listContainer} initial="hidden" animate="visible">
            {ACTIONS.map((a) => (
              <motion.button key={a.to} className="quick-row" variants={listItem} {...tap} onClick={() => navigate(a.to)}>
                <span className="qr-icon"><Svg d={a.icon} size={17} /></span>
                <span className="qr-title">{a.title}</span>
                <span className="qr-go"><Svg d={CHEVRON_R} size={15} /></span>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </div>
    </>
  );
}
