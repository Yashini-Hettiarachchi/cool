import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsApi } from '../api/jobs.api';

export default function JobCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    jobsApi.getSlotDetail(id)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="muted">Loading Job Card...</div>;
  if (!data) return <div className="error">Job card not found.</div>;

  const { customer, acUnit } = data;

  return (
    <div>
      <div className="jobcard-bar no-print">
        <button className="btn secondary" onClick={() => navigate(-1)}>← Back</button>
        <button className="btn primary" onClick={() => window.print()}>🖨️ Print Job Card</button>
      </div>

      <div className="jobcard-sheet">
        <div className="jc-head">
          <div className="jc-brand">
            <div className="jc-mark">H</div>
            <div>
              <div className="jc-company">HIGHCOOL</div>
              <div className="jc-company-sub">AC Servicing & Maintenance</div>
            </div>
          </div>
          <div className="jc-meta">
            <div className="jc-title">JOB CARD</div>
            <div className="jc-as">{data.agreement_no}</div>
            <div className="jc-visit">Scheduled Date: {data.scheduled_date}</div>
          </div>
        </div>

        <div className="jc-section">
          <div className="jc-h">1. CUSTOMER INFORMATION</div>
          <div className="jc-grid">
            <div className="jc-field"><span className="jc-label">Customer Name</span><span className="jc-value">{customer.name}</span></div>
            <div className="jc-field"><span className="jc-label">Phone</span><span className="jc-value">{customer.phone}</span></div>
            <div className="jc-field"><span className="jc-label">NIC</span><span className="jc-value">{customer.nic}</span></div>
            <div className="jc-field"><span className="jc-label">Route</span><span className="jc-value">{customer.route || '—'}</span></div>
            <div className="jc-field wide"><span className="jc-label">Address</span><span className="jc-value">{customer.address}</span></div>
          </div>
        </div>

        <div className="jc-section">
          <div className="jc-h">2. EQUIPMENT DETAILS</div>
          <div className="jc-grid">
            <div className="jc-field"><span className="jc-label">Brand</span><span className="jc-value">{acUnit.brand || '—'}</span></div>
            <div className="jc-field"><span className="jc-label">Model</span><span className="jc-value">{acUnit.model || '—'}</span></div>
            <div className="jc-field"><span className="jc-label">Indoor Serial</span><span className="jc-value">{acUnit.serial_indoor || '—'}</span></div>
            <div className="jc-field"><span className="jc-label">Outdoor Serial</span><span className="jc-value">{acUnit.serial_outdoor || '—'}</span></div>
          </div>
        </div>

        <div className="jc-section jc-notes">
          <div className="jc-h">3. TECHNICIAN WORK NOTES</div>
          <div className="jc-notebox">{data.comments || 'No technician notes recorded.'}</div>
        </div>

        <div className="jc-foot">
          <div className="jc-sign">
            <span className="jc-sign-line"></span>
            <span className="jc-sign-label">Technician Signature</span>
          </div>
          <div className="jc-sign">
            <span className="jc-sign-line"></span>
            <span className="jc-sign-label">Customer Signature</span>
          </div>
          <div className="jc-sign">
            <span className="jc-sign-line"></span>
            <span className="jc-sign-label">Date & Time</span>
          </div>
        </div>
      </div>
    </div>
  );
}
