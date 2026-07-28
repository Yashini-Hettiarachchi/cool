import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { jobsApi } from '../../api/jobs.api';
import { PageHeader, EmptyState, Alert, rowContainer, rowItem } from '../../components/ui';
import Pagination, { paginate } from '../../components/Pagination';

export default function JobCancellations() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    jobsApi.cancelled().then(({ jobs }) => setJobs(jobs)).catch((e) => setError(e.message)).finally(() => setLoaded(true));
  }, []);

  return (
    <div className="card">
      <PageHeader icon="xCircle" title="Job Cancellations"
        subtitle="Jobs cancelled (customer-driven), with reason. Distinct from Deleted Jobs." />
      <Alert tone="error">{error}</Alert>

      {loaded && jobs.length === 0 && !error ? (
        <EmptyState icon="xCircle" title="No cancelled jobs"
          hint="Cancelled visits, along with the reason given, will be listed here." />
      ) : (() => {
        const pg = paginate(jobs, page, 12);
        return (
        <>
        <table className="table">
          <thead><tr><th>AS-No</th><th>Customer</th><th>Scheduled</th><th>Reason</th><th>Route</th></tr></thead>
          <motion.tbody variants={rowContainer} initial="hidden" animate="visible">
            {pg.slice.map((j) => (
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
        <Pagination {...pg} onPage={setPage} unit="jobs" />
        </>
        );
      })()}
    </div>
  );
}
