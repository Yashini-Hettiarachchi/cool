import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../auth/AuthContext';
import { techApi } from '../../api/technician.api';
import { Svg, ICONS, EmptyState, rowContainer, rowItem } from '../../components/ui';
import TechJobCard from '../../components/TechJobCard';

const OPEN = ['scheduled', 'in_progress', 'postponed'];
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Technician home — every visit assigned to them, filterable. Defaults to all assigned. */
export default function TodayJobs() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all | today | open | done

  useEffect(() => {
    let alive = true;
    techApi.mine()
      .then((d) => alive && setJobs(d.jobs || []))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const today = todayStr();
  const buckets = useMemo(() => {
    const inDay = (j) => String(j.scheduled_date).slice(0, 10) === today;
    return {
      all: jobs,
      today: jobs.filter((j) => inDay(j) && j.status !== 'cancelled'),
      open: jobs.filter((j) => OPEN.includes(j.status)),
      done: jobs.filter((j) => j.status === 'completed'),
    };
  }, [jobs, today]);

  const shown = buckets[filter] || jobs;

  const FILTERS = [
    { key: 'all', label: 'All', count: buckets.all.length },
    { key: 'today', label: 'Today', count: buckets.today.length },
    { key: 'open', label: 'To do', count: buckets.open.length },
    { key: 'done', label: 'Done', count: buckets.done.length },
  ];

  return (
    <div className="tech-wrap">
      <div className="tech-hero">
        <span className="tech-hero-ico"><Svg d={ICONS.wrench} size={22} /></span>
        <div>
          <h1 style={{ margin: 0, fontSize: 20 }}>My Jobs</h1>
          <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>{user.name} · Technician</p>
        </div>
      </div>

      {/* At-a-glance: today's workload + what's left */}
      {!loading && !error && jobs.length > 0 && (
        <div className="tech-stats">
          {[
            { key: 'today', tone: 'amber', label: 'Today', n: buckets.today.length, icon: ICONS.calendar },
            { key: 'open', tone: 'brand', label: 'To do', n: buckets.open.length, icon: ICONS.jobs },
            { key: 'done', tone: 'green', label: 'Done', n: buckets.done.length, icon: 'M20 6L9 17l-5-5' },
          ].map((s) => (
            <motion.button key={s.key} type="button" whileTap={{ scale: 0.97 }}
              className={`tstat tone-${s.tone} ${filter === s.key ? 'on' : ''}`} onClick={() => setFilter(s.key)}>
              <span className="tstat-ico"><Svg d={s.icon} size={18} /></span>
              <span className="tstat-body">
                <span className="tstat-num">{s.n}</span>
                <span className="tstat-label">{s.label}</span>
              </span>
            </motion.button>
          ))}
        </div>
      )}

      <button className="btn secondary tech-search-btn" onClick={() => nav('/technician/search')}>
        <Svg d={ICONS.search} size={16} /> Search a job by AS- number
      </button>

      {/* Filter chips */}
      {!loading && !error && jobs.length > 0 && (
        <div className="tech-filter" role="tablist">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" role="tab" aria-selected={filter === f.key}
              className={`tfilter-chip ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
              {f.label} <span className="tfilter-count">{f.count}</span>
            </button>
          ))}
        </div>
      )}

      {loading && <div className="card muted" style={{ textAlign: 'center' }}>Loading your jobs…</div>}
      {error && <div className="alert error" role="alert">{error}</div>}

      {!loading && !error && jobs.length === 0 && (
        <EmptyState icon="calendar" title="No jobs assigned yet"
          hint="Visits assigned to you will appear here. You can still search any job by its AS- number." />
      )}

      {!loading && !error && jobs.length > 0 && shown.length === 0 && (
        <EmptyState icon="inbox"
          title={filter === 'today' ? 'Nothing scheduled today' : filter === 'done' ? 'No completed visits yet' : 'Nothing here'}
          hint="Try another filter, or search a job by its AS- number." />
      )}

      <AnimatePresence mode="wait">
        {!loading && shown.length > 0 && (
          <motion.div className="tjob-list" key={filter}
            variants={rowContainer} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
            {shown.map((j) => <TechJobCard key={j.id} job={j} variants={rowItem} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
