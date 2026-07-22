import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customersApi } from '../../api/customers.api';

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    customersApi.profile(id).then(setData).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="card"><p className="error">{error}</p></div>;
  if (!data) return <div className="card"><p className="muted">Loading…</p></div>;

  const { customer, acUnits, agreements } = data;

  return (
    <>
      <div className="card">
        <div className="row-between">
          <h1>{customer.name}</h1>
          <button onClick={() => navigate(`/agreements/new?customerId=${customer.id}`)}>+ New Agreement for this customer</button>
        </div>
        <div className="detail-grid">
          <div><span className="muted">Phone</span><div>{customer.phone}</div></div>
          <div><span className="muted">NIC</span><div>{customer.nic}</div></div>
          <div><span className="muted">Route</span><div>{customer.route || '—'}</div></div>
          <div><span className="muted">Address</span><div>{customer.address || '—'}</div></div>
          <div><span className="muted">Customer since</span><div>{customer.years_as_customer} year(s)</div></div>
        </div>
      </div>

      <div className="card">
        <h2>Agreements ({agreements.length})</h2>
        <table className="table">
          <thead>
            <tr><th>AS-No</th><th>AC (Brand / Model)</th><th>Normal / H-P</th><th>Period</th><th>Price</th><th>Status</th><th>End date</th></tr>
          </thead>
          <tbody>
            {agreements.map((a) => (
              <tr key={a.id}>
                <td>{a.agreement_no}</td>
                <td>{a.brand} / {a.model}</td>
                <td>{a.normal_count} / {a.hp_count}</td>
                <td>{a.period_days}d</td>
                <td>{a.price}</td>
                <td>{a.status}</td>
                <td>{a.end_date}</td>
              </tr>
            ))}
            {agreements.length === 0 && <tr><td colSpan="7" className="muted">No agreements yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>AC Units ({acUnits.length})</h2>
        <table className="table">
          <thead>
            <tr><th>Brand</th><th>Model</th><th>Serial (Indoor)</th><th>Serial (Outdoor)</th></tr>
          </thead>
          <tbody>
            {acUnits.map((u) => (
              <tr key={u.id}>
                <td>{u.brand}</td><td>{u.model}</td><td>{u.serial_indoor}</td><td>{u.serial_outdoor}</td>
              </tr>
            ))}
            {acUnits.length === 0 && <tr><td colSpan="4" className="muted">No AC units.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
