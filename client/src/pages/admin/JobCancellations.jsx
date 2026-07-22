import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { jobsApi } from '../../api/jobs.api';
import { PageHeader, EmptyState, rowContainer, rowItem } from '../../components/ui';

export default function JobCancellations() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    jobsApi.cancelled().then(({ jobs }) => setJobs(jobs)).catch((e) => setError(e.message)).finally(() => setLoaded(true));
  }, []);

  return (
    <div className="card">
      <PageHeader icon="xCircle" title="Job Cancellations"
        subtitle="Jobs cancelled (customer-driven), with reason. Distinct from Deleted Jobs." />
      {error && <p className="error">{error}</p>}

      {loaded && jobs.length === 0 && !error ? (
        <EmptyState icon="xCircle" title="No cancelled jobs"
          hint="Cancelled visits, along with the reason given, will be listed here." />
      ) : (
        <table className="table">
          <thead><tr><th>AS-No</th><th>Customer</th><th>Scheduled</th><th>Reason</th><th>Route</th></tr></thead>
          <motion.tbody variants={rowContainer} initial="hidden" animate="visible">
            {jobs.map((j) => (
              <motion.tr key={j.id} variants={rowItem}>
                <td><span className="as-chip">{j.agreement_no}</span></td>
                <td>{j.customer_name}</td>
                <td>{j.scheduled_date}</td>
                <td>{j.cancel_reason || '—'}</td>
                <td>{j.route || '—'}</td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      )}
    </div>
  );
}
