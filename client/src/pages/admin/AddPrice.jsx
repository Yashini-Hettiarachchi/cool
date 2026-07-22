import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { pricingApi } from '../../api/pricing.api';
import { tap } from '../../lib/motion';
import { PageHeader, Svg, ICONS } from '../../components/ui';

const TYPES = [
  { key: 'normal', label: 'Normal Service' },
  { key: 'hp', label: 'H/P (Hybrid) Service' },
];

export default function AddPrice() {
  const [prices, setPrices] = useState({ normal: '', hp: '' });
  const [saved, setSaved] = useState({ normal: '', hp: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');

  async function load() {
    try {
      const { pricing } = await pricingApi.list();
      const next = { normal: '', hp: '' };
      pricing.forEach((p) => { next[p.service_type] = p.price; });
      setPrices(next);
      setSaved(next);
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
      <PageHeader icon="tag" title="Pricing"
        subtitle="Set the default price per service type. These pre-fill new agreements (still editable per agreement)." />

      <AnimatePresence mode="wait">
        {error && <motion.p key="e" className="error alert-line" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>{error}</motion.p>}
        {notice && <motion.p key="n" className="notice alert-line" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>{notice}</motion.p>}
      </AnimatePresence>

      <div className="price-grid">
        {TYPES.map(({ key, label }) => {
          const dirty = String(prices[key]) !== String(saved[key]);
          return (
            <div key={key} className="price-card">
              <div className="pc-head">
                <span className="pc-ico"><Svg d={ICONS.tag} size={17} /></span>
                <div>
                  <div className="pc-name">{label}</div>
                  <div className="pc-current">Current: {saved[key] !== '' ? `LKR ${saved[key]}` : 'not set'}</div>
                </div>
              </div>
              <label className="field-label" htmlFor={`price-${key}`} style={{ display: 'block', marginBottom: 6 }}>Price (LKR)</label>
              <div className="pc-input">
                <span className="rs">Rs</span>
                <input
                  id={`price-${key}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={prices[key]}
                  onChange={(e) => setPrices((p) => ({ ...p, [key]: e.target.value }))}
                />
              </div>
              <div className="pc-actions">
                <motion.button {...tap} type="button" disabled={busy === key || !dirty} onClick={() => save(key)}>
                  {busy === key ? 'Saving…' : dirty ? 'Save' : 'Saved'}
                </motion.button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
