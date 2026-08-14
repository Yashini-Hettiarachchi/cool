import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsApi } from '../../api/jobs.api';
import { PageHead, EmptyState } from '../../components/ui';

export default function JobCancellations() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    jobsApi.getCancelled()
      .then(setJobs)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="muted">Loading cancellations...</div>;

  return (
    <div>
      <PageHead
        title="Cancelled Service Visits"
        sub="Archived visits cancelled by customer request or office."
      />

      <div className="card">
        {jobs.length === 0 ? (
          <EmptyState title="No Cancelled Visits" hint="There are currently no cancelled service visits." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Agreement</th>
                <th>Scheduled Date</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Cancellation Reason</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td className="mono"><strong>{j.agreement_no}</strong></td>
                  <td>{j.scheduled_date}</td>
                  <td><strong>{j.customer_name}</strong></td>
                  <td className="mono">{j.customer_phone}</td>
                  <td className="error">{j.cancel_reason || '—'}</td>
                  <td>
                    <button className="btn link" onClick={() => navigate(`/jobs/${j.id}`)}>
                      Open Slot →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
