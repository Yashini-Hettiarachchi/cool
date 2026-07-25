import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { agreementsApi } from '../../api/agreements.api';
import { customersApi } from '../../api/customers.api';
import { pricingApi } from '../../api/pricing.api';
import { tap, motionTokens } from '../../lib/motion';
import { Svg, ICONS } from '../../components/ui';

const PERIODS = [
  { d: 30, label: 'Monthly' },
  { d: 60, label: 'Bi-monthly' },
  { d: 90, label: 'Quarterly' },
  { d: 120, label: '4-monthly' },
];
const STEPS = ['Customer', 'AC Unit', 'Service Plan'];

const sectionV = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth } }),
};

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

  const activeStep = lockedCustomer ? 1 : 0;

  return (
    <form onSubmit={handleSubmit}>
      {/* Intro + step tracker */}
      <div className="card na-intro">
        <div className="fs-head" style={{ marginBottom: 4 }}>
          <span className="ph-icon" style={{ borderRadius: 13 }}><Svg d={ICONS.file} size={22} /></span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>New Agreement</h1>
            <p style={{ margin: '3px 0 0', fontSize: 13.5, color: 'var(--muted)' }}>Register the customer, their AC unit, and this year's service plan. Enter data only after full payment is confirmed.</p>
          </div>
        </div>
        <ol className="stepper">
          {STEPS.map((s, i) => (
            <li key={s} className={i <= activeStep ? 'done' : ''}>
              <span className="step-dot">{i + 1}</span><span className="step-name">{s}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* 1 — Customer */}
      <motion.section className="card form-section" custom={0} variants={sectionV} initial="hidden" animate="visible">
        <div className="fs-head">
          <span className="fs-num">1</span>
          <div>
            <h2>Customer {lockedCustomer && <span className="muted" style={{ fontWeight: 400 }}>· existing</span>}</h2>
            <p>Who the agreement is for. Data is entered only after full payment is confirmed.</p>
          </div>
        </div>
        <div className="form-grid">
          <IconField label="Name" icon="customer" required value={customer.name} onChange={(e) => setC('name', e.target.value)} placeholder="e.g. Nimal Silva" disabled={lockedCustomer} />
          <IconField label="Phone" icon="phone" required value={customer.phone} onChange={(e) => setC('phone', e.target.value)} placeholder="e.g. 0712223334" type="tel" disabled={lockedCustomer} />
          <IconField label="NIC" icon="idCard" required value={customer.nic} onChange={(e) => setC('nic', e.target.value)} placeholder="e.g. 911234567V" disabled={lockedCustomer} />
          <IconField label="Route" icon="pin" value={customer.route} onChange={(e) => setC('route', e.target.value)} placeholder="Delivery route (Sinhala supported)" disabled={lockedCustomer} />
          <IconField label="Address" icon="home" span value={customer.address} onChange={(e) => setC('address', e.target.value)} placeholder="Street, city" disabled={lockedCustomer} />
        </div>
        {lockedCustomer && (
          <button type="button" className="link" onClick={() => { setLockedCustomer(false); setC('id', null); }}>Edit / use a different customer</button>
        )}
      </motion.section>

      {/* 2 — AC Unit */}
      <motion.section className="card form-section" custom={1} variants={sectionV} initial="hidden" animate="visible">
        <div className="fs-head">
          <span className="fs-num">2</span>
          <div><h2>AC Unit</h2><p>The unit this agreement covers — each unit gets its own AS- number.</p></div>
        </div>
        <div className="form-grid">
          <IconField label="Brand" icon="ac" value={acUnit.brand} onChange={(e) => setA('brand', e.target.value)} placeholder="e.g. Daikin" />
          <IconField label="Model" icon="tag" value={acUnit.model} onChange={(e) => setA('model', e.target.value)} placeholder="e.g. FTKF35" />
          <IconField label="Serial — Indoor" icon="wrench" value={acUnit.serial_indoor} onChange={(e) => setA('serial_indoor', e.target.value)} placeholder="Indoor unit serial" />
          <IconField label="Serial — Outdoor" icon="wrench" value={acUnit.serial_outdoor} onChange={(e) => setA('serial_outdoor', e.target.value)} placeholder="Outdoor unit serial" />
          <IconField label="Install notes" icon="file" span value={acUnit.install_notes} onChange={(e) => setA('install_notes', e.target.value)} placeholder="Anything worth noting about the installation" />
        </div>
      </motion.section>

      {/* 3 — Agreement */}
      <motion.section className="card form-section" custom={2} variants={sectionV} initial="hidden" animate="visible">
        <div className="fs-head">
          <span className="fs-num">3</span>
          <div><h2>Service Plan</h2><p>Allocate the year's visits and confirm pricing.</p></div>
        </div>
        <div className="form-grid">
          <Stepper label="Normal visits" value={agreement.normal_count} onChange={(v) => setG('normal_count', v)}
            hint={`Default price: ${defaults.normal ? `LKR ${defaults.normal}` : '—'}`} />
          <Stepper label="H/P visits" value={agreement.hp_count} onChange={(v) => setG('hp_count', v)}
            hint={`Default price: ${defaults.hp ? `LKR ${defaults.hp}` : '—'}`} />
          <div className="field span-2">
            <span className="field-label">Period between visits</span>
            <div className="seg" role="group" aria-label="Period between visits">
              {PERIODS.map((p) => (
                <button type="button" key={p.d} className={Number(agreement.period_days) === p.d ? 'active' : ''} onClick={() => setG('period_days', p.d)}>
                  {p.d} days<small>{p.label}</small>
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

        {(() => {
          const price = agreement.price === '' ? null : Number(agreement.price);
          const paid = agreement.amount_paid === '' ? null : Number(agreement.amount_paid);
          if (price == null || paid == null || Number.isNaN(price) || Number.isNaN(paid)) return null;
          const bal = price - paid;
          if (bal > 0) return (
            <div className="pay-check short">
              <span className="fn-ico"><Svg d={ICONS.xCircle} size={18} /></span>
              <span>Amount paid is <b>LKR {bal.toLocaleString()}</b> short of the agreed price. Enter this agreement only once payment is complete.</span>
            </div>
          );
          return (
            <div className="pay-check ok">
              <span className="fn-ico"><Svg d="M20 6L9 17l-5-5" size={18} /></span>
              <span>Payment {bal < 0 ? 'exceeds' : 'matches'} the agreed price — good to go.</span>
            </div>
          );
        })()}

        <div className="form-note">
          <span className="fn-ico"><Svg d={ICONS.calendar} size={18} /></span>
          <span>
            {total === 0
              ? 'Add at least one Normal or H/P visit to schedule this agreement.'
              : <><b>{total}</b> visit{total === 1 ? '' : 's'} will be scheduled, <b>{agreement.period_days}</b> days apart across a 1-year agreement.</>}
          </span>
        </div>

        {error && <p className="error">{error}</p>}

        <div className="form-bar">
          <motion.button type="button" {...tap} className="secondary" onClick={() => navigate('/customers')}>Cancel</motion.button>
          <motion.button type="submit" {...tap} disabled={busy || total === 0}>{busy ? 'Creating…' : 'Create agreement'}</motion.button>
        </div>
      </motion.section>
    </form>
  );
}

/* Label + icon-prefixed input */
function IconField({ label, icon, required, hint, span, ...input }) {
  return (
    <label className={`field${span ? ' span-2' : ''}`}>
      <span className="field-label">{label}{required && <b className="req">*</b>}</span>
      <span className="field-control">
        {icon && <span className="fc-icon"><Svg d={ICONS[icon]} size={16} /></span>}
        <input {...input} required={required} className={icon ? 'has-icon' : undefined} />
      </span>
      {hint && <span className="hint">{hint}</span>}
    </label>
  );
}

/* Number stepper (− value +) */
function Stepper({ label, hint, value, onChange, min = 0 }) {
  const v = Number(value) || 0;
  const set = (n) => onChange(String(Math.max(min, n)));
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="stepper-ctl">
        <button type="button" onClick={() => set(v - 1)} disabled={v <= min} aria-label={`Decrease ${label}`}>−</button>
        <input type="number" min={min} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} />
        <button type="button" onClick={() => set(v + 1)} aria-label={`Increase ${label}`}>+</button>
      </div>
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}
