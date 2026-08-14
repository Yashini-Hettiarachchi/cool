import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { technicianApi } from '../../api/technician.api';
import Lightbox from '../../components/Lightbox';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // Completion states
  const [serviceType, setServiceType] = useState('normal');
  const [comments, setComments] = useState('');
  const [uploading, setUploading] = useState(false);

  const [activePhotos, setActivePhotos] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const loadData = () => {
    technicianApi.getJobDetail(id)
      .then((data) => {
        setJob(data);
        setComments(data.comments || '');
        if (data.service_type_used) setServiceType(data.service_type_used);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) return <div className="muted">Loading job details...</div>;
  if (!job) return <div className="error">Job not found.</div>;

  const { customer, acUnit } = job;

  const handleStart = async () => {
    await technicianApi.startJob(id);
    loadData();
  };

  const handleComplete = async () => {
    await technicianApi.completeJob(id, serviceType, comments);
    alert('Job submitted as completed! Awaiting office confirmation.');
    loadData();
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await technicianApi.uploadPhoto(id, file);
      loadData();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="tech-wrap">
      <button className="btn secondary" onClick={() => navigate(-1)} style={{ width: 'fit-content', marginBottom: 10 }}>
        ← Back
      </button>

      <div className="card">
        <div className="row-between">
          <div>
            <span className="chip mono">{job.agreement_no}</span>
            <h1 style={{ margin: '6px 0 2px' }}>{customer.name}</h1>
            <p className="muted" style={{ margin: 0 }}>📞 <a href={`tel:${customer.phone}`}>{customer.phone}</a> • 📍 {customer.address}</p>
          </div>
          <span className={`badge-soft st-${job.status}`}>{job.status?.replace('_', ' ')}</span>
        </div>

        <div className="info-grid" style={{ marginTop: 14 }}>
          <div className="info-tile"><div className="info-body"><span className="info-label">Unit Brand</span><span className="info-value">{acUnit.brand} {acUnit.model}</span></div></div>
          <div className="info-tile"><div className="info-body"><span className="info-label">Serials</span><span className="info-value">In: {acUnit.serial_indoor || '—'}</span></div></div>
          <div className="info-tile"><div className="info-body"><span className="info-label">Visit Date</span><span className="info-value">{job.scheduled_date}</span></div></div>
        </div>
      </div>

      {/* Start Job Action */}
      {job.status === 'scheduled' && (
        <div className="card">
          <button className="btn primary block" style={{ width: '100%', padding: 14, fontSize: 16 }} onClick={handleStart}>
            ▶️ Start Job (On Site)
          </button>
        </div>
      )}

      {/* Photo Proof Upload */}
      <div className="card">
        <div className="tech-block-head" style={{ marginBottom: 10 }}>
          <span>📷 Photo Proof ({job.photos?.length || 0})</span>
          <label className="btn secondary sm" style={{ margin: 0, cursor: 'pointer' }}>
            {uploading ? 'Uploading...' : '+ Upload Photo'}
            <input type="file" accept="image/*" onChange={handleUploadPhoto} hidden />
          </label>
        </div>

        <div className="photo-grid">
          {job.photos?.map((p, idx) => (
            <div key={p.id} className="photo-thumb" onClick={() => { setActivePhotos(job.photos); setPhotoIndex(idx); }}>
              <img src={p.photo_path} alt="Proof" />
            </div>
          ))}
        </div>
      </div>

      {/* Work Completion Form */}
      {(job.status === 'in_progress' || job.status === 'completed') && (
        <div className="card">
          <h3>Work Order Completion</h3>
          <div className="field">
            <span className="field-label">Service Performed</span>
            <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
              <option value="normal">Normal Service (Rs. 3,500)</option>
              <option value="hp">H/P High Pressure Service (Rs. 5,000)</option>
            </select>
          </div>

          <div className="field">
            <span className="field-label">Technician Servicing Remarks</span>
            <textarea rows="3" value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Note gas pressure, cleaning details, replacement parts..." />
          </div>

          <button className="btn primary block" style={{ width: '100%', marginTop: 10, padding: 14, fontSize: 16 }} onClick={handleComplete}>
            ✓ Submit Job as Complete
          </button>
        </div>
      )}

      {activePhotos && (
        <Lightbox photos={activePhotos} index={photoIndex} onClose={() => setActivePhotos(null)} onNavigate={setPhotoIndex} />
      )}
    </div>
  );
}
