import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { agreementsApi } from '../../api/agreements.api';
import { customersApi } from '../../api/customers.api';
import { pricingApi } from '../../api/pricing.api';

const PERIODS = [30, 60, 90, 120];

export default function NewAgreement() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const presetCustomerId = params.get('customerId');

  const [customer, setCustomer] = useState({ id: null, name: '', phone: '', nic: '', address: '', route: '' });
  const [lockedCustomer, setLockedCustomer] = useState(false);
  const [acUnit, setAcUnit] = useState({ model: '', brand: '', serial_indoor: '', serial_outdoor: '', install_notes: '' });
  const [agreement, setAgreement] = useState({ normal_count: 1, hp_count: 0, period_days: 90, price: '', amount_paid: '' });
  const [defaults, setDefaults] = useState({ normal: null, hp: null });

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  // Preload existing customer if arriving from a profile, and default pricing.
  useEffect(() => {
    pricingApi.list().then(({ pricing }) => {
      const d = { normal: null, hp: null };
      pricing.forEach((p) => { d[p.service_type] = p.price; });
      setDefaults(d);
    }).catch(() => {});

    if (presetCustomerId) {
      customersApi.profile(presetCustomerId).then(({ customer: c }) => {
        setCustomer({ id: c.id, name: c.name, phone: c.phone, nic: c.nic, address: c.address || '', route: c.route || '' });
        setLockedCustomer(true);
      }).catch((e) => setError(e.message));
    }
  }, [presetCustomerId]);

  const setC = (f, v) => setCustomer((s) => ({ ...s, [f]: v }));
  const setA = (f, v) => setAcUnit((s) => ({ ...s, [f]: v }));
  const setG = (f, v) => setAgreement((s) => ({ ...s, [f]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const payload = {
        customer: lockedCustomer
          ? { id: customer.id }
          : { name: customer.name, phone: customer.phone, nic: customer.nic, address: customer.address, route: customer.route },
        acUnit,
        agreement: {
          normal_count: Number(agreement.normal_count) || 0,
          hp_count: Number(agreement.hp_count) || 0,
          period_days: Number(agreement.period_days),
          price: agreement.price === '' ? null : Number(agreement.price),
          amount_paid: Number(agreement.amount_paid),
        },
      };
      const res = await agreementsApi.create(payload);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="card">
        <h1>Agreement created</h1>
        <p className="notice">
          Number <strong>{result.agreement.agreement_no}</strong> — {result.jobsCreated} service visit(s) scheduled.
          Activation SMS: <strong>{result.sms}</strong>.
        </p>
        <table className="table">
          <thead><tr><th>#</th><th>Scheduled date</th><th>Status</th></tr></thead>
          <tbody>
            {result.jobs.map((j, i) => (
              <tr key={j.id}><td>{i + 1}</td><td>{j.scheduled_date}</td><td>{j.status}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="form-actions">
          <button onClick={() => navigate(`/customers/${result.agreement.customer_id}`)}>View customer</button>
          <button className="secondary" onClick={() => { setResult(null); navigate('/agreements/new'); }}>Create another</button>
        </div>
      </div>
    );
  }

  const total = (Number(agreement.normal_count) || 0) + (Number(agreement.hp_count) || 0);

  return (
    <form onSubmit={handleSubmit}>
      <div className="card">
        <h1>New Agreement (Create Job)</h1>
        <p className="muted">Enter customer + AC unit + agreement. Data is entered only after full payment is confirmed.</p>

        <h2>Customer {lockedCustomer && <span className="muted">(existing)</span>}</h2>
        <div className="form-grid">
          <label>Name<input value={customer.name} onChange={(e) => setC('name', e.target.value)} disabled={lockedCustomer} required /></label>
          <label>Phone<input value={customer.phone} onChange={(e) => setC('phone', e.target.value)} disabled={lockedCustomer} required /></label>
          <label>NIC<input value={customer.nic} onChange={(e) => setC('nic', e.target.value)} disabled={lockedCustomer} required /></label>
          <label>Route<input value={customer.route} onChange={(e) => setC('route', e.target.value)} disabled={lockedCustomer} /></label>
          <label className="span-2">Address<input value={customer.address} onChange={(e) => setC('address', e.target.value)} disabled={lockedCustomer} /></label>
        </div>
        {lockedCustomer && <button type="button" className="link" onClick={() => { setLockedCustomer(false); setC('id', null); }}>Edit / use different customer</button>}
      </div>

      <div className="card">
        <h2>AC Unit</h2>
        <div className="form-grid">
          <label>Brand<input value={acUnit.brand} onChange={(e) => setA('brand', e.target.value)} /></label>
          <label>Model<input value={acUnit.model} onChange={(e) => setA('model', e.target.value)} /></label>
          <label>Serial (Indoor)<input value={acUnit.serial_indoor} onChange={(e) => setA('serial_indoor', e.target.value)} /></label>
          <label>Serial (Outdoor)<input value={acUnit.serial_outdoor} onChange={(e) => setA('serial_outdoor', e.target.value)} /></label>
          <label className="span-2">Install notes<input value={acUnit.install_notes} onChange={(e) => setA('install_notes', e.target.value)} /></label>
        </div>
      </div>

      <div className="card">
        <h2>Agreement</h2>
        <p className="muted">
          Default prices — Normal: {defaults.normal ?? '—'}, H/P: {defaults.hp ?? '—'} (LKR). Set the agreed price below.
        </p>
        <div className="form-grid">
          <label>Normal visits<input type="number" min="0" value={agreement.normal_count} onChange={(e) => setG('normal_count', e.target.value)} /></label>
          <label>H/P visits<input type="number" min="0" value={agreement.hp_count} onChange={(e) => setG('hp_count', e.target.value)} /></label>
          <label>Period (days)
            <select value={agreement.period_days} onChange={(e) => setG('period_days', e.target.value)}>
              {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label>Price (LKR)<input type="number" min="0" step="0.01" value={agreement.price} onChange={(e) => setG('price', e.target.value)} placeholder={defaults.normal ?? ''} /></label>
          <label>Amount paid (LKR)<input type="number" min="0" step="0.01" value={agreement.amount_paid} onChange={(e) => setG('amount_paid', e.target.value)} required /></label>
        </div>
        <p className="muted">{total} visit(s) will be scheduled, {agreement.period_days} days apart over 1 year.</p>

        {error && <p className="error">{error}</p>}
        <div className="form-actions">
          <button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create agreement'}</button>
          <button type="button" className="secondary" onClick={() => navigate('/customers')}>Cancel</button>
        </div>
      </div>
    </form>
  );
}
