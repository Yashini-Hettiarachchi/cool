import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { technicianApi } from '../../api/technician.api';
import { PageHead, EmptyState } from '../../components/ui';

export default function TodayJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    technicianApi.getTodayJobs()
      .then(setJobs)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="muted">Loading assigned jobs...</div>;

  return (
    <div className="tech-wrap">
      <PageHead
        title="Field Technician — Assigned Visits"
        sub="Your assigned visits for today."
        actions={
          <button className="btn secondary" onClick={() => navigate('/technician/search')}>
            🔍 Search All Jobs
          </button>
        }
      />

      {jobs.length === 0 ? (
        <div className="card">
          <EmptyState title="No Visits Assigned Today" hint="You currently have no active service visits assigned for today." />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {jobs.map((j) => (
            <div key={j.id} className="card clickable" onClick={() => navigate(`/technician/jobs/${j.id}`)}>
              <div className="row-between">
                <div>
                  <span className="chip mono">{j.agreement_no}</span>
                  <h3 style={{ margin: '6px 0 2px' }}>{j.customer_name}</h3>
                  <p className="muted" style={{ margin: 0 }}>📞 {j.customer_phone} • 📍 {j.customer_address}</p>
                  <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                    Unit: {j.ac_brand} {j.ac_model}
                  </div>
                </div>
                <div>
                  <span className={`badge-soft st-${j.status}`}>{j.status?.replace('_', ' ')}</span>
                  <div style={{ marginTop: 10, textAlign: 'right' }}>
                    <button className="btn primary sm">Open Job →</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
