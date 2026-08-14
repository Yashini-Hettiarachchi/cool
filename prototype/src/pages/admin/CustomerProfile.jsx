import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customersApi } from '../../api/customers.api';
import { PageHead } from '../../components/ui';

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customersApi.getProfile(id)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="muted">Loading customer profile...</div>;
  if (!profile) return <div className="error">Customer profile not found.</div>;

  return (
    <div>
      <PageHead
        title={profile.name}
        sub={`Customer #${profile.id} • Registered ${profile.created_at?.slice(0, 10)}`}
        actions={
          <button className="btn primary" onClick={() => navigate(`/agreements/new?customerId=${profile.id}`)}>
            + New Agreement
          </button>
        }
      />

      <div className="card">
        <h2>Customer Information</h2>
        <div className="detail-grid">
          <div><span className="muted">Phone Number</span><strong>{profile.phone}</strong></div>
          <div><span className="muted">NIC Number</span><strong>{profile.nic}</strong></div>
          <div><span className="muted">Route</span><strong>{profile.route || '—'}</strong></div>
          <div className="span-2"><span className="muted">Installation Address</span><p style={{ margin: 0 }}>{profile.address}</p></div>
        </div>
      </div>

      <div className="card">
        <h2>Registered AC Units ({profile.acUnits?.length || 0})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Model</th>
              <th>Indoor Serial</th>
              <th>Outdoor Serial</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {profile.acUnits?.map((ac) => (
              <tr key={ac.id}>
                <td><strong>{ac.brand}</strong></td>
                <td>{ac.model}</td>
                <td className="mono">{ac.serial_indoor || '—'}</td>
                <td className="mono">{ac.serial_outdoor || '—'}</td>
                <td className="muted">{ac.install_notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Service Agreements ({profile.agreements?.length || 0})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Agreement No</th>
              <th>Period</th>
              <th>Price</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {profile.agreements?.map((ag) => (
              <tr key={ag.id}>
                <td className="mono"><strong>{ag.agreement_no}</strong></td>
                <td>{ag.period_days} days</td>
                <td>Rs. {Number(ag.price).toLocaleString()}</td>
                <td>{ag.start_date}</td>
                <td>{ag.end_date}</td>
                <td><span className={`badge-soft st-${ag.status}`}>{ag.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
