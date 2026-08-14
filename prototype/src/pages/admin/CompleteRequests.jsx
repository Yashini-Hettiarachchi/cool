import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsApi } from '../../api/jobs.api';
import { PageHead, EmptyState } from '../../components/ui';
import Lightbox from '../../components/Lightbox';

export default function CompleteRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhotos, setActivePhotos] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const loadData = () => {
    jobsApi.getUnconfirmed()
      .then(setRequests)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirm = async (id) => {
    await jobsApi.confirmCompletion(id);
    loadData();
  };

  if (loading) return <div className="muted">Loading approval queue...</div>;

  return (
    <div>
      <PageHead
        title="Job Completion Approvals"
        sub="Review completed technician service reports & photo proof."
      />

      {requests.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Approval Queue Clean!"
            hint="All completed technician visits have been reviewed and confirmed."
          />
        </div>
      ) : (
        <div className="approve-list">
          {requests.map((r) => (
            <div key={r.id} className="card approve-card">
              <div className="approve-head">
                <div>
                  <span className="chip mono">{r.agreement_no}</span>
                  <h3 style={{ margin: '4px 0 0' }}>{r.customer_name}</h3>
                  <span className="muted">{r.customer_phone} • {r.customer_route || 'No route'}</span>
                </div>
                <button className="btn primary" onClick={() => handleConfirm(r.id)}>
                  ✓ Confirm Completion
                </button>
              </div>

              <div className="approve-meta">
                <span><b>Technician:</b> {r.technician_name}</span>
                <span><b>Completed:</b> {r.completed_at || r.scheduled_date}</span>
                <span><b>Service Type:</b> {r.service_type_used?.toUpperCase() || 'NORMAL'}</span>
              </div>

              {r.comments && <p className="approve-comment">"{r.comments}"</p>}

              {r.photos?.length > 0 && (
                <div>
                  <span className="muted" style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    Photo Proof ({r.photos.length} uploaded):
                  </span>
                  <div className="photo-grid">
                    {r.photos.map((p, idx) => (
                      <div
                        key={p.id}
                        className="photo-thumb"
                        onClick={() => { setActivePhotos(r.photos); setPhotoIndex(idx); }}
                      >
                        <img src={p.photo_path} alt="Proof" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="approve-actions">
                <button className="btn link" onClick={() => navigate(`/jobs/${r.id}`)}>
                  View Full Job Slot →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activePhotos && (
        <Lightbox
          photos={activePhotos}
          index={photoIndex}
          onClose={() => setActivePhotos(null)}
          onNavigate={(i) => setPhotoIndex(i)}
        />
      )}
    </div>
  );
}
