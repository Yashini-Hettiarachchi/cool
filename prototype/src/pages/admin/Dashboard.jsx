import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsApi } from '../../api/jobs.api';
import { PageHead } from '../../components/ui';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  const loadData = () => {
    jobsApi.getDashboardMetrics().then(setData);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!data) return <div className="muted">Loading dashboard...</div>;

  return (
    <div>
      <PageHead
        title="Operations Dashboard"
        sub="Highcool Service Hub overview & daily activity."
        actions={
          <button className="btn primary" onClick={() => navigate('/agreements/new')}>
            + New Agreement
          </button>
        }
      />

      <div className="kpi-grid">
        <div className="kpi-tile tone-amber" onClick={() => navigate('/assignments')}>
          <div className="kpi-icon tone-amber">📋</div>
          <div className="kpi-body">
            <span className="kpi-num">{data.unassigned}</span>
            <span className="kpi-label">Unassigned Jobs</span>
          </div>
        </div>

        <div className="kpi-tile tone-blue" onClick={() => navigate('/calendar')}>
          <div className="kpi-icon tone-blue">⚡</div>
          <div className="kpi-body">
            <span className="kpi-num">{data.inProgress}</span>
            <span className="kpi-label">In Progress</span>
          </div>
        </div>

        <div className="kpi-tile tone-brand attention" onClick={() => navigate('/complete-requests')}>
          <div className="kpi-icon tone-brand">✓</div>
          <div className="kpi-body">
            <span className="kpi-num">{data.pendingApproval}</span>
            <span className="kpi-label">Pending Approval</span>
          </div>
        </div>

        <div className="kpi-tile tone-green" onClick={() => navigate('/calendar')}>
          <div className="kpi-icon tone-green">📅</div>
          <div className="kpi-body">
            <span className="kpi-num">{data.todayVisits}</span>
            <span className="kpi-label">Today's Visits</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Upcoming Scheduled Visits</h2>
        <div className="upcoming-list">
          {data.upcoming.map((j) => (
            <div key={j.id} className="up-item" onClick={() => navigate(`/jobs/${j.id}`)} style={{ cursor: 'pointer' }}>
              <div className="up-date">
                <b>{j.scheduled_date.slice(8, 10)}</b>
                <i>{j.scheduled_date.slice(5, 7)}</i>
              </div>
              <div className="up-body">
                <span className="up-name">{j.customer_name} ({j.agreement_no})</span>
                <span className="up-meta">{j.customer_phone} • {j.customer_route || 'No route'}</span>
              </div>
              <span className={`badge-soft st-${j.status}`}>{j.status?.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
