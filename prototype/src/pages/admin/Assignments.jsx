import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsApi } from '../../api/jobs.api';
import { usersApi } from '../../api/users.api';
import { PageHead, EmptyState } from '../../components/ui';

export default function Assignments() {
  const navigate = useNavigate();
  const [unassigned, setUnassigned] = useState([]);
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [uJobs, uUsers] = await Promise.all([jobsApi.getUnassigned(), usersApi.list()]);
      setUnassigned(uJobs);
      setTechs(uUsers.filter(u => u.role === 'technician' && u.active));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async (jobId, techId) => {
    await jobsApi.assignTechnician(jobId, techId);
    loadData();
  };

  if (loading) return <div className="muted">Loading unassigned jobs...</div>;

  return (
    <div>
      <PageHead
        title="Unassigned Job Assignments"
        sub="Assign active technicians to scheduled service visits."
      />

      <div className="card">
        {unassigned.length === 0 ? (
          <EmptyState
            title="All Jobs Assigned!"
            hint="There are currently no scheduled jobs waiting for technician assignment."
          />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Agreement</th>
                <th>Scheduled Date</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Route</th>
                <th>Assign Technician</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {unassigned.map((j) => (
                <tr key={j.id}>
                  <td className="mono"><strong>{j.agreement_no}</strong></td>
                  <td>{j.scheduled_date}</td>
                  <td><strong>{j.customer_name}</strong></td>
                  <td className="mono">{j.customer_phone}</td>
                  <td>{j.customer_route || '—'}</td>
                  <td>
                    <select
                      value={j.technician_id || ''}
                      onChange={(e) => handleAssign(j.id, e.target.value)}
                      style={{ margin: 0, padding: '4px 8px' }}
                    >
                      <option value="">-- Select Technician --</option>
                      {techs.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </td>
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
