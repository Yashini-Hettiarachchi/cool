import { useEffect, useState } from 'react';
import { jobsApi } from '../../api/jobs.api';

export default function DeletedJobs() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    jobsApi.deleted().then(({ jobs }) => setJobs(jobs)).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="card">
      <h1>Deleted Jobs</h1>
      <p className="muted">Jobs removed as mistake corrections (soft-deleted). Distinct from cancellations.</p>
      {error && <p className="error">{error}</p>}
      <table className="table">
        <thead><tr><th>AS-No</th><th>Customer</th><th>Scheduled</th><th>Status</th><th>Route</th></tr></thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id}>
              <td>{j.agreement_no}</td><td>{j.customer_name}</td><td>{j.scheduled_date}</td><td>{j.status}</td><td>{j.route}</td>
            </tr>
          ))}
          {jobs.length === 0 && <tr><td colSpan="5" className="muted">No deleted jobs.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
