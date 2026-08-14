import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { agreementsApi } from '../../api/agreements.api';
import { PageHead } from '../../components/ui';

export default function NewAgreement() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // Customer state
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custNic, setCustNic] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custRoute, setCustRoute] = useState('');

  // AC Unit state
  const [acBrand, setAcBrand] = useState('Daikin');
  const [acModel, setAcModel] = useState('FTKF35');
  const [serialIn, setSerialIn] = useState('');
  const [serialOut, setSerialOut] = useState('');

  // Agreement state
  const [normalCount, setNormalCount] = useState(2);
  const [hpCount, setHpCount] = useState(2);
  const [periodDays, setPeriodDays] = useState(90);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const normalPrice = 3500;
  const hpPrice = 5000;
  const totalPrice = normalCount * normalPrice + hpCount * hpPrice;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ag = await agreementsApi.create({
        customer: { name: custName, phone: custPhone, nic: custNic, address: custAddress, route: custRoute },
        acUnit: { brand: acBrand, model: acModel, serialIndoor: serialIn, serialOutdoor: serialOut },
        normalCount,
        hpCount,
        periodDays,
        price: totalPrice,
        startDate
      });
      navigate(`/customers/${ag.customer_id}`);
    } catch (err) {
      alert('Failed to create agreement: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHead
        title="Create 1-Year Service Agreement"
        sub="Register customer, AC unit details, and auto-generate scheduled visits."
      />

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h2>1. Customer Details</h2>
          <div className="form-grid">
            <div className="field"><label>Customer Name *</label><input type="text" value={custName} onChange={(e) => setCustName(e.target.value)} required placeholder="e.g. Nimal Silva" /></div>
            <div className="field"><label>Phone Number *</label><input type="text" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} required placeholder="0771234567" /></div>
            <div className="field"><label>NIC Number *</label><input type="text" value={custNic} onChange={(e) => setCustNic(e.target.value)} required placeholder="901234567V" /></div>
            <div className="field"><label>Route</label><input type="text" value={custRoute} onChange={(e) => setCustRoute(e.target.value)} placeholder="e.g. Colombo 03" /></div>
            <div className="field span-2"><label>Address *</label><input type="text" value={custAddress} onChange={(e) => setCustAddress(e.target.value)} required placeholder="Full street address" /></div>
          </div>
        </div>

        <div className="card">
          <h2>2. AC Unit Details</h2>
          <div className="form-grid">
            <div className="field"><label>Brand</label><input type="text" value={acBrand} onChange={(e) => setAcBrand(e.target.value)} placeholder="Daikin / Mitsubishi / LG" /></div>
            <div className="field"><label>Model</label><input type="text" value={acModel} onChange={(e) => setAcModel(e.target.value)} placeholder="FTKF35" /></div>
            <div className="field"><label>Indoor Serial</label><input type="text" value={serialIn} onChange={(e) => setSerialIn(e.target.value)} placeholder="Indoor S/N" /></div>
            <div className="field"><label>Outdoor Serial</label><input type="text" value={serialOut} onChange={(e) => setSerialOut(e.target.value)} placeholder="Outdoor S/N" /></div>
          </div>
        </div>

        <div className="card">
          <h2>3. Service Counts & Pricing</h2>
          <div className="form-grid">
            <div className="field">
              <label>Normal Service Count (Rs. 3,500 ea)</label>
              <input type="number" min="0" value={normalCount} onChange={(e) => setNormalCount(Number(e.target.value))} />
            </div>
            <div className="field">
              <label>H/P High Pressure Count (Rs. 5,000 ea)</label>
              <input type="number" min="0" value={hpCount} onChange={(e) => setHpCount(Number(e.target.value))} />
            </div>
            <div className="field">
              <label>Service Period (Days between visits)</label>
              <select value={periodDays} onChange={(e) => setPeriodDays(Number(e.target.value))}>
                <option value={60}>60 Days (6 visits / yr)</option>
                <option value={90}>90 Days (4 visits / yr)</option>
                <option value={120}>120 Days (3 visits / yr)</option>
              </select>
            </div>
            <div className="field">
              <label>Agreement Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
          </div>

          <div className="form-note" style={{ marginTop: 14 }}>
            <span>Total Calculated Price: <b>Rs. {totalPrice.toLocaleString()}</b> ({normalCount + hpCount} total visits auto-scheduled every {periodDays} days)</span>
          </div>

          <div className="form-actions" style={{ marginTop: 20 }}>
            <button type="submit" className="btn primary" disabled={submitting}>
              {submitting ? 'Creating Agreement...' : 'Create & Generate Schedule'}
            </button>
            <button type="button" className="btn secondary" onClick={() => navigate('/customers')}>Cancel</button>
          </div>
        </div>
      </form>
    </div>
  );
}
