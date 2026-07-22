import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { jobsApi } from '../../api/jobs.api';
import { PageHeader, EmptyState, rowContainer, rowItem } from '../../components/ui';

export default function DeletedJobs() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    jobsApi.deleted().then(({ jobs }) => setJobs(jobs)).catch((e) => setError(e.message)).finally(() => setLoaded(true));
  }, []);

  return (
    <div className="card">
      <PageHeader icon="trash" title="Deleted Jobs"
        subtitle="Jobs removed as mistake corrections (soft-deleted). Distinct from cancellations." />
      {error && <p className="error">{error}</p>}

      {loaded && jobs.length === 0 && !error ? (
        <EmptyState icon="trash" title="No deleted jobs"
          hint="Jobs soft-deleted from the Job Detail screen will appear here for reference." />
      ) : (
        <table className="table">
          <thead><tr><th>AS-No</th><th>Customer</th><th>Scheduled</th><th>Status</th><th>Route</th></tr></thead>
          <motion.tbody variants={rowContainer} initial="hidden" animate="visible">
            {jobs.map((j) => (
              <motion.tr key={j.id} variants={rowItem}>
                <td><span className="as-chip">{j.agreement_no}</span></td>
                <td>{j.customer_name}</td>
                <td>{j.scheduled_date}</td>
                <td><span className={`badge-soft st-${j.status}`}>{j.status}</span></td>
                <td>{j.route || '—'}</td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      )}
    </div>
  );
}
