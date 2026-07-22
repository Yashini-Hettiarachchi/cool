import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { techApi } from '../../api/technician.api';
import { Svg, ICONS } from '../../components/ui';
import { statusClass, statusLabel, shortDate } from '../../components/TechJobCard';

const INFO = [
  { key: 'phone', icon: 'phone', label: 'Phone' },
  { key: 'route', icon: 'pin', label: 'Route' },
  { key: 'address', icon: 'home', label: 'Address' },
];

export default function JobDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const fileRef = useRef(null);

  const [job, setJob] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [urls, setUrls] = useState({});           // photoId -> objectURL
  const [serviceType, setServiceType] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');            // '', 'start', 'upload', 'complete', 'comment'
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function loadPhotos() {
    const d = await techApi.photos(id);
    setPhotos(d.photos || []);
    return d.photos || [];
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { job } = await techApi.detail(id);
        if (!alive) return;
        setJob(job);
        setServiceType(job.service_type_used || '');
        setComment(job.comments || '');
        await loadPhotos();
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Resolve authenticated blob URLs for any photos we don't have yet.
  useEffect(() => {
    let alive = true;
    photos.forEach((p) => {
      if (urls[p.id]) return;
      techApi.photoUrl(id, p.id).then((u) => { if (alive) setUrls((m) => ({ ...m, [p.id]: u })); }).catch(() => {});
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  // Revoke object URLs on unmount.
  useEffect(() => () => Object.values(urls).forEach(URL.revokeObjectURL), [urls]);

  const flash = (msg) => { setNotice(msg); setError(''); setTimeout(() => setNotice(''), 3000); };
  const fail = (e) => setError(e.message || 'Something went wrong');

  async function refreshJob() {
    const { job } = await techApi.detail(id);
    setJob(job);
  }

  async function start() {
    setBusy('start'); setError('');
    try { await techApi.setStatus(id, 'in_progress'); await refreshJob(); flash('Job started'); }
    catch (e) { fail(e); } finally { setBusy(''); }
  }

  async function onFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const remaining = 5 - photos.length;
    if (remaining <= 0) { setError('Maximum of 5 photos reached'); return; }
    setBusy('upload'); setError('');
    try {
      await techApi.uploadPhotos(id, files.slice(0, remaining));
      await loadPhotos();
      if (files.length > remaining) flash(`Only ${remaining} more photo(s) could be added (max 5)`);
    } catch (e) { fail(e); } finally { setBusy(''); }
  }

  async function saveComment() {
    setBusy('comment'); setError('');
    try { await techApi.comment(id, comment); flash('Comment saved'); }
    catch (e) { fail(e); } finally { setBusy(''); }
  }

  async function complete() {
    if (!serviceType) { setError('Choose the service type (Normal or H/P) before completing'); return; }
    setBusy('complete'); setError('');
    try {
      if (comment !== (job.comments || '')) await techApi.comment(id, comment);
      await techApi.setStatus(id, 'completed', serviceType);
      await refreshJob();
      flash('Job completed — sent for admin approval');
    } catch (e) { fail(e); } finally { setBusy(''); }
  }

  if (loading) return <div className="card muted" style={{ textAlign: 'center' }}>Loading job…</div>;
  if (error && !job) return <div className="alert error">{error}</div>;
  if (!job) return null;

  const done = job.status === 'completed';
  const started = job.status === 'in_progress';

  return (
    <div className="tech-wrap tech-detail">
      <button className="btn ghost tech-back" onClick={() => nav(-1)}>
        <Svg d={ICONS.arrow} size={16} /> <span style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>←</span> Back
      </button>

      <div className="card tech-detail-head">
        <div className="tjob-top">
          <span className="tjob-as">{job.agreement_no}</span>
          <span className={`badge-soft ${statusClass(job.status)}`}>{statusLabel(job.status)}</span>
        </div>
        <h1 style={{ margin: '6px 0 2px', fontSize: 22 }}>{job.customer_name}</h1>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          <Svg d={ICONS.calendar} size={13} /> {shortDate(job.scheduled_date)}
        </p>
      </div>

      <AnimatePresence>
        {(notice || error) && (
          <motion.div className={`alert ${error ? 'error' : 'ok'}`}
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {error || notice}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer / site info */}
      <div className="info-grid tech-info">
        {INFO.map((f) => job[f.key] && (
          <div className="info-tile" key={f.key}>
            <span className="info-ico"><Svg d={ICONS[f.icon]} size={16} /></span>
            <div className="info-body">
              <span className="info-label">{f.label}</span>
              <span className="info-value">{job[f.key]}</span>
            </div>
          </div>
        ))}
        <div className="info-tile">
          <span className="info-ico"><Svg d={ICONS.ac} size={16} /></span>
          <div className="info-body">
            <span className="info-label">AC Unit</span>
            <span className="info-value">{[job.brand, job.model].filter(Boolean).join(' ') || '—'}</span>
          </div>
        </div>
      </div>

      {done ? (
        <div className="card tech-complete-card">
          <span className="tc-ico"><Svg d={ICONS.star} size={22} /></span>
          <div>
            <strong>Completed</strong>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: 13 }}>
              Logged as {job.service_type_used === 'hp' ? 'H/P' : 'Normal'} service · awaiting admin approval.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Start */}
          {!started && (
            <button className="btn primary block" onClick={start} disabled={busy === 'start'}>
              <Svg d={ICONS.wrench} size={16} /> {busy === 'start' ? 'Starting…' : 'Start this job'}
            </button>
          )}

          {/* Photos */}
          <div className="card tech-photos">
            <div className="tech-block-head">
              <span><Svg d={ICONS.file} size={16} /> Photos</span>
              <span className={`photo-count ${photos.length >= 4 ? 'good' : ''}`}>{photos.length} / 5</span>
            </div>
            <p className="muted" style={{ margin: '0 0 10px', fontSize: 12 }}>Add up to 5 photos of the work.</p>

            <div className="photo-grid">
              {photos.map((p) => (
                <div className="photo-thumb" key={p.id}>
                  {urls[p.id]
                    ? <img src={urls[p.id]} alt="job" />
                    : <span className="photo-loading" />}
                </div>
              ))}
              {photos.length < 5 && (
                <button type="button" className="photo-add" onClick={() => fileRef.current?.click()} disabled={busy === 'upload'}>
                  <Svg d={ICONS.add || 'M12 5v14M5 12h14'} size={22} />
                  <span>{busy === 'upload' ? 'Uploading…' : 'Add'}</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple hidden onChange={onFiles} />
          </div>

          {/* Service type */}
          <div className="card">
            <div className="tech-block-head"><span><Svg d={ICONS.tag} size={16} /> Service type</span></div>
            <div className="seg">
              <button type="button" className={`seg-opt ${serviceType === 'normal' ? 'active' : ''}`} onClick={() => setServiceType('normal')}>Normal</button>
              <button type="button" className={`seg-opt ${serviceType === 'hp' ? 'active' : ''}`} onClick={() => setServiceType('hp')}>H/P</button>
            </div>
          </div>

          {/* Comment */}
          <div className="card">
            <div className="tech-block-head">
              <span><Svg d={ICONS.file} size={16} /> Comment</span>
              <button className="btn ghost sm" onClick={saveComment} disabled={busy === 'comment'}>
                {busy === 'comment' ? 'Saving…' : 'Save'}
              </button>
            </div>
            <textarea className="tech-comment" rows={3} value={comment}
              onChange={(e) => setComment(e.target.value)} placeholder="Notes about the visit (optional)…" />
          </div>

          {/* Complete (sticky) */}
          <div className="tech-actionbar">
            <button className="btn primary block" onClick={complete} disabled={busy === 'complete'}>
              <Svg d={ICONS.star} size={16} /> {busy === 'complete' ? 'Completing…' : 'Complete & send for approval'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
