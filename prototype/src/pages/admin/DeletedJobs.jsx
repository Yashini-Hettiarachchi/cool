import { useEffect, useState } from 'react';
import { jobsApi } from '../../api/jobs.api';
import { PageHead, EmptyState } from '../../components/ui';

export default function DeletedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    jobsApi.getDeleted()
      .then(setJobs)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRestore = async (id) => {
    await jobsApi.restore(id);
    loadData();
  };

  if (loading) return <div className="muted">Loading deleted jobs...</div>;

  return (
    <div>
      <PageHead
        title="Soft-Deleted Jobs Archive"
        sub="View and restore accidentally deleted service slots."
      />

      <div className="card">
        {jobs.length === 0 ? (
          <EmptyState title="No Deleted Jobs" hint="The soft-deleted jobs trash bin is empty." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Agreement</th>
                <th>Scheduled Date</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Comments</th>
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
                  <td className="muted">{j.comments || '—'}</td>
                  <td>
                    <button className="btn secondary sm" onClick={() => handleRestore(j.id)}>
                      Restore Slot
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
