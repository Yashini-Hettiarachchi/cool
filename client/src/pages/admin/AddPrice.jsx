import { useEffect, useState } from 'react';
import { pricingApi } from '../../api/pricing.api';

const TYPES = [
  { key: 'normal', label: 'Normal' },
  { key: 'hp', label: 'H/P (Hybrid)' },
];

export default function AddPrice() {
  const [prices, setPrices] = useState({ normal: '', hp: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');

  async function load() {
    try {
      const { pricing } = await pricingApi.list();
      const next = { normal: '', hp: '' };
      pricing.forEach((p) => { next[p.service_type] = p.price; });
      setPrices(next);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function save(type) {
    setError('');
    setNotice('');
    setBusy(type);
    try {
      await pricingApi.set(type, prices[type]);
      setNotice(`${type === 'hp' ? 'H/P' : 'Normal'} price saved.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="card">
      <h1>Pricing</h1>
      <p className="muted">Set the default price per service type. These pre-fill new agreements (still editable per agreement).</p>

      {error && <p className="error">{error}</p>}
      {notice && <p className="notice">{notice}</p>}

      <div className="form-grid">
        {TYPES.map(({ key, label }) => (
          <div key={key} className="price-row">
            <label>
              {label} price (LKR)
              <input
                type="number"
                min="0"
                step="0.01"
                value={prices[key]}
                onChange={(e) => setPrices((p) => ({ ...p, [key]: e.target.value }))}
              />
            </label>
            <button type="button" disabled={busy === key} onClick={() => save(key)}>
              {busy === key ? 'Saving…' : 'Save'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
