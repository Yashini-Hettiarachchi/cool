import { useEffect, useState } from 'react';
import { pricingApi } from '../../api/pricing.api';
import { PageHead } from '../../components/ui';

export default function AddPrice() {
  const [pricing, setPricing] = useState([]);
  const [normalPrice, setNormalPrice] = useState(3500);
  const [hpPrice, setHpPrice] = useState(5000);

  const loadData = () => {
    pricingApi.get().then((items) => {
      setPricing(items);
      const n = items.find(p => p.service_type === 'normal');
      const h = items.find(p => p.service_type === 'hp');
      if (n) setNormalPrice(n.price);
      if (h) setHpPrice(h.price);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveNormal = async () => {
    await pricingApi.update('normal', normalPrice);
    alert('Normal service default price updated.');
    loadData();
  };

  const handleSaveHp = async () => {
    await pricingApi.update('hp', hpPrice);
    alert('High-Pressure (H/P) default price updated.');
    loadData();
  };

  return (
    <div>
      <PageHead
        title="Default Service Pricing"
        sub="Manage base prices for 1-year agreement service calculations."
      />

      <div className="price-grid">
        <div className="price-card">
          <div className="pc-head">
            <div className="pc-ico">🔧</div>
            <div>
              <div className="pc-name">Normal AC Servicing</div>
              <div className="pc-current">Standard filter & coil cleaning</div>
            </div>
          </div>
          <div className="pc-input">
            <span className="rs">Rs.</span>
            <input type="number" value={normalPrice} onChange={(e) => setNormalPrice(e.target.value)} />
          </div>
          <div className="pc-actions">
            <button className="btn primary" onClick={handleSaveNormal}>Update Normal Price</button>
          </div>
        </div>

        <div className="price-card">
          <div className="pc-head">
            <div className="pc-ico">⚡</div>
            <div>
              <div className="pc-name">H/P High Pressure Service</div>
              <div className="pc-current">Deep jet chemical wash & pressure test</div>
            </div>
          </div>
          <div className="pc-input">
            <span className="rs">Rs.</span>
            <input type="number" value={hpPrice} onChange={(e) => setHpPrice(e.target.value)} />
          </div>
          <div className="pc-actions">
            <button className="btn primary" onClick={handleSaveHp}>Update H/P Price</button>
          </div>
        </div>
      </div>
    </div>
  );
}
