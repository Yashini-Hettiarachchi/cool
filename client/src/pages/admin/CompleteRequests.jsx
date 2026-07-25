import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { jobsApi } from '../../api/jobs.api';
import { PageHeader, EmptyState, Pill, Avatar, Svg, ICONS, rowContainer, rowItem } from '../../components/ui';
import Lightbox from '../../components/Lightbox';

/** Authenticated photo grid for one job (JWT is in memory → fetch as blobs). */
function PhotoReview({ jobId, onOpen }) {
  const [urls, setUrls] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    const made = [];
    jobsApi.photos(jobId)
      .then(({ photos }) => Promise.all(photos.map((p) =>
        jobsApi.photoUrl(jobId, p.id).then((u) => { made.push(u); return u; }).catch(() => null))))
      .then((list) => { if (alive) { setUrls(list.filter(Boolean)); setLoaded(true); } })
      .catch(() => { if (alive) setLoaded(true); });
    return () => { alive = false; made.forEach(URL.revokeObjectURL); };
  }, [jobId]);

  if (!loaded) return <div className="photo-grid"><span className="photo-loading" style={{ height: 90, borderRadius: 10 }} /></div>;
  if (urls.length === 0) return <p className="muted" style={{ fontSize: 13, margin: '4px 0 0' }}>No photos attached.</p>;
  return (
    <div className="photo-grid">
      {urls.map((u, i) => (
        <button type="button" className="photo-thumb" key={i} title="View photo" onClick={() => onOpen(urls, i)}>
          <img src={u} alt={`Job photo ${i + 1}`} />
        </button>
      ))}
    </div>
  );
}

export default function CompleteRequests() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState(null);
  const [confirmId, setConfirmId] = useState(null); // job pending a 2nd-step confirm
  const [done, setDone] = useState('');
  const [lb, setLb] = useState(null); // { images, index }
  const [tab, setTab] = useState('pending'); // 'pending' | 'approved'
  const approvedView = tab === 'approved';

  useEffect(() => {
    setBusy(true); setError('');
    jobsApi.completeRequests(approvedView ? 'approved' : undefined)
      .then(({ jobs }) => setJobs(jobs || []))
      .catch((e) => setError(e.message))
      .finally(() => setBusy(false));
  }, [tab, approvedView]);

  async function approve(job) {
    setApproving(job.id); setConfirmId(null); setError('');
    try {
      await jobsApi.confirm(job.id);
      setJobs((l) => l.filter((j) => j.id !== job.id));
      window.dispatchEvent(new Event('approvals-changed')); // refresh sidebar badge
      setDone(`Approved ${job.agreement_no} — ${job.customer_name}.`);
      setTimeout(() => setDone(''), 3500);
    } catch (e) { setError(e.message); }
    finally { setApproving(null); }
  }

  return (
    <div>
      <PageHeader icon="inbox" title="Completion Approvals"
        subtitle={busy ? 'Loading…'
          : approvedView
            ? `${jobs.length} approved completion${jobs.length === 1 ? '' : 's'}.`
            : `${jobs.length} completion${jobs.length === 1 ? '' : 's'} awaiting your review.`} />

      <div className="seg" style={{ marginBottom: 16 }}>
        <button type="button" className={!approvedView ? 'active' : ''} onClick={() => setTab('pending')}>Pending</button>
        <button type="button" className={approvedView ? 'active' : ''} onClick={() => setTab('approved')}>Approved</button>
      </div>

      <AnimatePresence>
        {done && (
          <motion.p className="alert ok" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{done}</motion.p>
        )}
      </AnimatePresence>
      {error && <p className="error">{error}</p>}

      {!busy && jobs.length === 0 && !error && (
        approvedView
          ? <EmptyState icon="inbox" title="No approved completions yet"
              hint="Once you approve a technician's completed visit, it will be listed here." />
          : <EmptyState icon="inbox" title="Nothing to approve"
              hint="When a technician completes a visit, it lands here with their photos for you to review and confirm." />
      )}

      <motion.div className="approve-list" variants={rowContainer} initial="hidden" animate="visible">
        {jobs.map((job) => (
          <motion.div className="card approve-card" key={job.id} variants={rowItem}>
            <div className="approve-head">
              <div className="name-cell">
                <Avatar name={job.customer_name} size={38} />
                <div>
                  <div className="nc-main">{job.customer_name}</div>
                  <div className="nc-sub"><span className="mono">{job.agreement_no}</span> · {job.route || 'No route'}</div>
                </div>
              </div>
              <Pill tone={job.service_type_used === 'hp' ? 'blue' : 'brand'}>
                {job.service_type_used === 'hp' ? 'H/P service' : 'Normal service'}
              </Pill>
            </div>

            <div className="approve-meta">
              <span><Svg d={ICONS.ac} size={14} /> {[job.brand, job.model].filter(Boolean).join(' ') || '—'}</span>
              <span><Svg d={ICONS.wrench} size={14} /> {job.technician_name || 'Unknown tech'}</span>
              <span><Svg d={ICONS.calendar} size={14} /> {job.completed_at ? new Date(job.completed_at).toLocaleDateString() : job.scheduled_date}</span>
              <span><Svg d={ICONS.file} size={14} /> {job.photo_count} photo{job.photo_count === 1 ? '' : 's'}</span>
            </div>

            {job.comments && <p className="approve-comment">“{job.comments}”</p>}

            <PhotoReview jobId={job.id} onOpen={(images, index) => setLb({ images, index })} />

            <div className="approve-actions">
              {approvedView && <Pill tone="green">Approved</Pill>}
              <button className="btn ghost" onClick={() => navigate(`/jobs/${job.id}`)}>Open full detail</button>
              {!approvedView && confirmId !== job.id && (
                <button className="btn primary" onClick={() => setConfirmId(job.id)}>
                  <Svg d="M20 6L9 17l-5-5" size={16} /> Approve completion
                </button>
              )}
            </div>

            {!approvedView && confirmId === job.id && (
              <motion.div className="approve-confirm" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                <span className="ac-note">
                  <Svg d={ICONS.inbox} size={16} />
                  Mark <b>{job.agreement_no}</b> complete? The customer will be notified — this can't be undone.
                </span>
                <div className="ac-btns">
                  <button className="btn ghost" disabled={approving === job.id} onClick={() => setConfirmId(null)}>Not yet</button>
                  <button className="btn primary" disabled={approving === job.id} onClick={() => approve(job)}>
                    <Svg d="M20 6L9 17l-5-5" size={16} /> {approving === job.id ? 'Approving…' : 'Yes, approve'}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </motion.div>

      <Lightbox images={lb?.images || []} index={lb?.index}
        onClose={() => setLb(null)} onIndex={(i) => setLb((s) => ({ ...s, index: i }))} />
    </div>
  );
}
