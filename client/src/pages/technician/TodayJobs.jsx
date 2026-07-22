import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../../auth/AuthContext';
import { techApi } from '../../api/technician.api';
import { Svg, ICONS, EmptyState, rowContainer, rowItem } from '../../components/ui';
import TechJobCard from '../../components/TechJobCard';

/** Technician home — today's assigned visits, in route order. */
export default function TodayJobs() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    techApi.today()
      .then((d) => alive && setJobs(d.jobs || []))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  return (
    <div className="tech-wrap">
      <div className="tech-hero">
        <span className="tech-hero-ico"><Svg d={ICONS.wrench} size={22} /></span>
        <div>
          <h1 style={{ margin: 0, fontSize: 20 }}>My Jobs</h1>
          <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>{user.name} · Technician</p>
        </div>
      </div>

      <button className="btn secondary tech-search-btn" onClick={() => nav('/technician/search')}>
        <Svg d={ICONS.search} size={16} /> Search a job by AS- number
      </button>

      <div className="tech-section-label">Today · {new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}</div>

      {loading && <div className="card muted" style={{ textAlign: 'center' }}>Loading your jobs…</div>}
      {error && <div className="alert error">{error}</div>}

      {!loading && !error && jobs.length === 0 && (
        <EmptyState icon="calendar" title="No jobs today" hint="Assigned visits for today will appear here. You can still search any job by its AS- number." />
      )}

      {!loading && jobs.length > 0 && (
        <motion.div className="tjob-list" variants={rowContainer} initial="hidden" animate="visible">
          {jobs.map((j) => <TechJobCard key={j.id} job={j} variants={rowItem} />)}
        </motion.div>
      )}
    </div>
  );
}
