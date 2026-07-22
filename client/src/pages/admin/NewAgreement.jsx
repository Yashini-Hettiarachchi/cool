import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { agreementsApi } from '../../api/agreements.api';
import { customersApi } from '../../api/customers.api';
import { pricingApi } from '../../api/pricing.api';
import { tap } from '../../lib/motion';

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
      setResult(await agreementsApi.create(payload));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="card success-card">
        <div className="success-badge">✓</div>
        <h1>Agreement created</h1>
        <p className="muted">
          Number <span className="mono chip">{result.agreement.agreement_no}</span> — {result.jobsCreated} service
          visit(s) scheduled. Activation SMS: <strong>{result.sms}</strong>.
        </p>
        <table className="table">
          <thead><tr><th>#</th><th>Scheduled date</th><th>Status</th></tr></thead>
          <tbody>
            {result.jobs.map((j, i) => (
              <tr key={j.id}><td>{i + 1}</td><td>{j.scheduled_date}</td><td><span className={`badge st-${j.status}`}>{j.status}</span></td></tr>
            ))}
          </tbody>
        </table>
        <div className="form-actions">
          <motion.button {...tap} onClick={() => navigate(`/customers/${result.agreement.customer_id}`)}>View customer</motion.button>
          <motion.button {...tap} className="secondary" onClick={() => { setResult(null); navigate('/agreements/new'); }}>Create another</motion.button>
        </div>
      </div>
    );
  }

  const total = (Number(agreement.normal_count) || 0) + (Number(agreement.hp_count) || 0);

  return (
    <form onSubmit={handleSubmit}>
      {/* 1 — Customer */}
      <section className="card form-section">
        <div className="fs-head">
          <span className="fs-num">1</span>
          <div>
            <h2>Customer {lockedCustomer && <span className="muted" style={{ fontWeight: 400 }}>· existing</span>}</h2>
            <p>Who the agreement is for. Data is entered only after full payment is confirmed.</p>
          </div>
        </div>
        <div className="form-grid">
          <label className="field">
            <span className="field-label">Name <b className="req">*</b></span>
            <input value={customer.name} onChange={(e) => setC('name', e.target.value)} placeholder="e.g. Nimal Silva" disabled={lockedCustomer} required />
          </label>
          <label className="field">
            <span className="field-label">Phone <b className="req">*</b></span>
            <input value={customer.phone} onChange={(e) => setC('phone', e.target.value)} placeholder="e.g. 0712223334" disabled={lockedCustomer} required />
          </label>
          <label className="field">
            <span className="field-label">NIC <b className="req">*</b></span>
            <input value={customer.nic} onChange={(e) => setC('nic', e.target.value)} placeholder="e.g. 911234567V" disabled={lockedCustomer} required />
          </label>
          <label className="field">
            <span className="field-label">Route</span>
            <input value={customer.route} onChange={(e) => setC('route', e.target.value)} placeholder="Delivery route (Sinhala supported)" disabled={lockedCustomer} />
          </label>
          <label className="field span-2">
            <span className="field-label">Address</span>
            <input value={customer.address} onChange={(e) => setC('address', e.target.value)} placeholder="Street, city" disabled={lockedCustomer} />
          </label>
        </div>
        {lockedCustomer && (
          <button type="button" className="link" onClick={() => { setLockedCustomer(false); setC('id', null); }}>Edit / use a different customer</button>
        )}
      </section>

      {/* 2 — AC Unit */}
      <section className="card form-section">
        <div className="fs-head">
          <span className="fs-num">2</span>
          <div><h2>AC Unit</h2><p>The unit this agreement covers — each unit gets its own AS- number.</p></div>
        </div>
        <div className="form-grid">
          <label className="field">
            <span className="field-label">Brand</span>
            <input value={acUnit.brand} onChange={(e) => setA('brand', e.target.value)} placeholder="e.g. Daikin" />
          </label>
          <label className="field">
            <span className="field-label">Model</span>
            <input value={acUnit.model} onChange={(e) => setA('model', e.target.value)} placeholder="e.g. FTKF35" />
          </label>
          <label className="field">
            <span className="field-label">Serial — Indoor</span>
            <input value={acUnit.serial_indoor} onChange={(e) => setA('serial_indoor', e.target.value)} placeholder="Indoor unit serial" />
          </label>
          <label className="field">
            <span className="field-label">Serial — Outdoor</span>
            <input value={acUnit.serial_outdoor} onChange={(e) => setA('serial_outdoor', e.target.value)} placeholder="Outdoor unit serial" />
          </label>
          <label className="field span-2">
            <span className="field-label">Install notes</span>
            <input value={acUnit.install_notes} onChange={(e) => setA('install_notes', e.target.value)} placeholder="Anything worth noting about the installation" />
          </label>
        </div>
      </section>

      {/* 3 — Agreement */}
      <section className="card form-section">
        <div className="fs-head">
          <span className="fs-num">3</span>
          <div><h2>Service Plan</h2><p>Allocate the year's visits and confirm pricing.</p></div>
        </div>
        <div className="form-grid">
          <label className="field">
            <span className="field-label">Normal visits</span>
            <input type="number" min="0" value={agreement.normal_count} onChange={(e) => setG('normal_count', e.target.value)} />
            <span className="hint">Default price: {defaults.normal ? `LKR ${defaults.normal}` : '—'}</span>
          </label>
          <label className="field">
            <span className="field-label">H/P visits</span>
            <input type="number" min="0" value={agreement.hp_count} onChange={(e) => setG('hp_count', e.target.value)} />
            <span className="hint">Default price: {defaults.hp ? `LKR ${defaults.hp}` : '—'}</span>
          </label>
          <div className="field span-2">
            <span className="field-label">Period between visits</span>
            <div className="seg" role="group" aria-label="Period in days">
              {PERIODS.map((p) => (
                <button type="button" key={p} className={Number(agreement.period_days) === p ? 'active' : ''} onClick={() => setG('period_days', p)}>
                  {p} days
                </button>
              ))}
            </div>
          </div>
          <label className="field">
            <span className="field-label">Agreed price (LKR)</span>
            <div className="input-prefix">
              <span>Rs</span>
              <input type="number" min="0" step="0.01" value={agreement.price} onChange={(e) => setG('price', e.target.value)} placeholder={defaults.normal ?? '0.00'} />
            </div>
          </label>
          <label className="field">
            <span className="field-label">Amount paid (LKR) <b className="req">*</b></span>
            <div className="input-prefix">
              <span>Rs</span>
              <input type="number" min="0" step="0.01" value={agreement.amount_paid} onChange={(e) => setG('amount_paid', e.target.value)} placeholder="0.00" required />
            </div>
          </label>
        </div>

        <div className="form-note">
          <span>📅</span>
          <span><b>{total}</b> visit{total === 1 ? '' : 's'} will be scheduled, <b>{agreement.period_days}</b> days apart across a 1-year agreement.</span>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="form-bar">
          <motion.button type="button" {...tap} className="secondary" onClick={() => navigate('/customers')}>Cancel</motion.button>
          <motion.button type="submit" {...tap} disabled={busy}>{busy ? 'Creating…' : 'Create agreement'}</motion.button>
        </div>
      </section>
    </form>
  );
}
