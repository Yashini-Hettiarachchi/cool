import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsApi } from '../../api/jobs.api';
import { usersApi } from '../../api/users.api';
import Lightbox from '../../components/Lightbox';

export default function JobSlot() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [postponeDays, setPostponeDays] = useState(10);
  const [postponeReason, setPostponeReason] = useState('');
  const [comments, setComments] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const [activePhotos, setActivePhotos] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const loadData = async () => {
    try {
      const [slot, uList] = await Promise.all([jobsApi.getSlotDetail(id), usersApi.list()]);
      setData(slot);
      setComments(slot.comments || '');
      setTechs(uList.filter(u => u.role === 'technician' && u.active));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) return <div className="muted">Loading job slot...</div>;
  if (!data) return <div className="error">Job slot not found.</div>;

  const { customer, acUnit } = data;

  const handleAssign = async (tId) => {
    await jobsApi.assignTechnician(id, tId);
    loadData();
  };

  const handlePostpone = async (e) => {
    e.preventDefault();
    if (!postponeReason) return alert('Please provide a postpone reason.');
    await jobsApi.postpone(id, postponeDays, postponeReason);
    loadData();
  };

  const handleSaveComments = async () => {
    await jobsApi.updateComments(id, comments);
    alert('Comments updated successfully.');
    loadData();
  };

  const handleCancel = async () => {
    if (!cancelReason) return alert('Please enter cancellation reason.');
    await jobsApi.cancel(id, cancelReason);
    loadData();
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to soft-delete this job slot?')) {
      await jobsApi.softDelete(id);
      navigate('/calendar');
    }
  };

  return (
    <div>
      <button className="btn secondary" onClick={() => navigate(-1)} style={{ marginBottom: 14 }}>
        ← Back
      </button>

      <div className="card">
        <div className="row-between">
          <div>
            <span className="chip mono">{data.agreement_no}</span>
            <h1 style={{ margin: '6px 0 0' }}>{customer.name}</h1>
            <span className="muted">{customer.phone} • {customer.address}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={`badge-soft st-${data.status}`}>{data.status?.replace('_', ' ')}</span>
            <div style={{ marginTop: 8 }}>
              <button className="btn secondary sm" onClick={() => navigate(`/jobs/${id}/card`)}>
                🖨️ View Job Card
              </button>
            </div>
          </div>
        </div>

        <div className="info-grid" style={{ marginTop: 20 }}>
          <div className="info-tile">
            <div className="info-body">
              <span className="info-label">Scheduled Date</span>
              <span className="info-value">{data.scheduled_date}</span>
            </div>
          </div>
          <div className="info-tile">
            <div className="info-body">
              <span className="info-label">Assigned Technician</span>
              <span className="info-value">{data.technician_name || 'Unassigned'}</span>
            </div>
          </div>
          <div className="info-tile">
            <div className="info-body">
              <span className="info-label">AC Brand & Model</span>
              <span className="info-value">{acUnit.brand} {acUnit.model}</span>
            </div>
          </div>
          <div className="info-tile">
            <div className="info-body">
              <span className="info-label">Admin Confirmed</span>
              <span className="info-value">{data.admin_confirmed ? '✅ Confirmed' : '⏳ Pending'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="action-groups">
        {/* Assign Technician */}
        <div className="action-group card">
          <h3>Assign Technician</h3>
          <p className="muted">Assign or reassign an active technician to this visit.</p>
          <div className="action-controls">
            <select value={data.technician_id || ''} onChange={(e) => handleAssign(e.target.value)}>
              <option value="">-- Unassigned --</option>
              {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        {/* Postpone Visit */}
        <div className="action-group card tone-warn">
          <h3>Postpone Visit</h3>
          <p className="muted">Reschedule visit date forward.</p>
          <form onSubmit={handlePostpone} className="action-controls">
            <input type="number" min="1" className="ctl-days" value={postponeDays} onChange={(e) => setPostponeDays(e.target.value)} />
            <input type="text" placeholder="Reason for postponing..." value={postponeReason} onChange={(e) => setPostponeReason(e.target.value)} />
            <button type="submit" className="btn secondary">Postpone</button>
          </form>
        </div>
      </div>

      {/* Office Comments */}
      <div className="card" style={{ marginTop: 14 }}>
        <h3>Office Comments & Technician Notes</h3>
        <textarea rows="3" value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Add remarks or notes for this visit..." />
        <div style={{ marginTop: 10, textAlign: 'right' }}>
          <button className="btn secondary" onClick={handleSaveComments}>Save Comments</button>
        </div>
      </div>

      {/* Photos */}
      {data.photos?.length > 0 && (
        <div className="card">
          <h3>Technician Photo Proof ({data.photos.length})</h3>
          <div className="photo-grid">
            {data.photos.map((p, idx) => (
              <div key={p.id} className="photo-thumb" onClick={() => { setActivePhotos(data.photos); setPhotoIndex(idx); }}>
                <img src={p.photo_path} alt="Photo" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel or Delete */}
      <div className="card danger-zone">
        <div>
          <strong>Cancel or Delete Visit</strong>
          <p style={{ margin: 0 }}>Cancel this visit with a reason, or soft-delete it from active views.</p>
        </div>
        <div className="action-controls">
          <input type="text" placeholder="Cancellation reason..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          <button className="btn danger" onClick={handleCancel}>Cancel Visit</button>
          <button className="btn secondary danger" onClick={handleDelete}>Delete Slot</button>
        </div>
      </div>

      {activePhotos && (
        <Lightbox photos={activePhotos} index={photoIndex} onClose={() => setActivePhotos(null)} onNavigate={setPhotoIndex} />
      )}
    </div>
  );
}
