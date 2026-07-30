import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { jobsApi } from '../../api/jobs.api';
import { PageHeader, EmptyState, Pill, Avatar, Svg, ICONS, Alert, rowContainer, rowItem } from '../../components/ui';
import Lightbox from '../../components/Lightbox';

/**
 * Suffix appended to the "Approved" toast, per the `sms` status the confirm
 * endpoint reports. 'sent' needs no note — the happy path is what the confirm
 * strip already promised. Anything else means the customer was NOT texted, and
 * the office needs to know that.
 */
const SMS_NOTE = {
  logged: ' (SMS is in log-only mode — customer not texted yet.)',
  failed: ' SMS could not be sent — the customer was not notified.',
  'skipped-no-phone': ' No phone number on file — the customer was not notified.',
};

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
  // Count for the tab the user is NOT on, so the pair reads as a queue at a
  // glance ("1 pending / 6 approved") rather than one number in isolation.
  const [otherCount, setOtherCount] = useState(null);

  useEffect(() => {
    setBusy(true); setError('');
    jobsApi.completeRequests(approvedView ? 'approved' : undefined)
      .then(({ jobs }) => setJobs(jobs || []))
      .catch((e) => setError(e.message))
      .finally(() => setBusy(false));
  }, [tab, approvedView]);

  useEffect(() => {
    let alive = true;
    jobsApi.completeRequests(approvedView ? undefined : 'approved')
      .then(({ jobs }) => { if (alive) setOtherCount((jobs || []).length); })
      .catch(() => { if (alive) setOtherCount(null); });
    return () => { alive = false; };
  }, [tab, approvedView, done]);

  async function approve(job) {
    setApproving(job.id); setConfirmId(null); setError('');
    try {
      const { sms } = await jobsApi.confirm(job.id);
      setJobs((l) => l.filter((j) => j.id !== job.id));
      window.dispatchEvent(new Event('approvals-changed')); // refresh sidebar badge
      // The confirm strip promises the customer will be notified — say so when
      // that didn't actually happen, instead of a bare "Approved".
      setDone(`Approved ${job.agreement_no} — ${job.customer_name}.${SMS_NOTE[sms] || ''}`);
      setTimeout(() => setDone(''), 5000);
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

      <div className="seg approve-tabs" role="tablist" aria-label="Completion queue">
        <button type="button" role="tab" aria-selected={!approvedView}
          className={!approvedView ? 'active' : ''} onClick={() => setTab('pending')}>
          Pending
          <small>{(!approvedView ? jobs.length : otherCount) ?? '—'}</small>
        </button>
        <button type="button" role="tab" aria-selected={approvedView}
          className={approvedView ? 'active' : ''} onClick={() => setTab('approved')}>
          Approved
          <small>{(approvedView ? jobs.length : otherCount) ?? '—'}</small>
        </button>
      </div>

      <AnimatePresence>
        {done && (
          /* role="status" not "alert": a successful approval is confirmation, not an
             interruption, so it is announced politely without stealing focus. */
          <motion.p className="alert ok" role="status" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{done}</motion.p>
        )}
      </AnimatePresence>
      <Alert tone="error">{error}</Alert>

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
                  <div className="nc-sub">
                    <span className="mono">{job.agreement_no}</span>
                    {job.route && <> · {job.route}</>}
                  </div>
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

            {/* Asking and acting occupy the same slot. Showing the confirm strip
                *below* a still-live "Approve completion" button left two primary
                buttons on screen at once — the question and its own answer. */}
            {!approvedView && confirmId === job.id ? (
              <motion.div className="approve-confirm" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
                <span className="ac-note">
                  <Svg d={ICONS.alert} size={16} />
                  <span>
                    Mark <b className="mono">{job.agreement_no}</b> complete?
                    <em> {job.customer_name} will be texted, and this can’t be undone.</em>
                  </span>
                </span>
                <div className="ac-btns">
                  <button className="btn ghost" disabled={approving === job.id} onClick={() => setConfirmId(null)}>Not yet</button>
                  <button className="btn primary" disabled={approving === job.id} onClick={() => approve(job)}>
                    <Svg d="M20 6L9 17l-5-5" size={16} /> {approving === job.id ? 'Approving…' : 'Yes, approve'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="approve-actions">
                <button className="btn ghost sm" onClick={() => navigate(`/jobs/${job.id}`)}>
                  Open full detail <Svg d={ICONS.arrow} size={14} />
                </button>
                <div className="aa-end">
                  {approvedView
                    ? <Pill tone="green">Approved</Pill>
                    : (
                      <button className="btn primary" onClick={() => setConfirmId(job.id)}>
                        <Svg d="M20 6L9 17l-5-5" size={16} /> Approve completion
                      </button>
                    )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      <Lightbox images={lb?.images || []} index={lb?.index}
        onClose={() => setLb(null)} onIndex={(i) => setLb((s) => ({ ...s, index: i }))} />
    </div>
  );
}
