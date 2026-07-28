import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { jobsApi } from '../../api/jobs.api';
import { Alert } from '../../components/ui';
import { listContainer, listItem, tap, motionTokens } from '../../lib/motion';

/* ---- inline icon set (paths split on "M" by <Svg>) ---- */
const ICONS = {
  customer: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z',
  route: 'M12 22s8-4.5 8-11.8A8 8 0 0 0 4 10.2C4 17.5 12 22 12 22zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  address: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  ac: 'M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9L4.9 19.1',
  scheduled: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  technician: 'M14.7 6.3a4 4 0 0 0-5.6 5.6l-6.4 6.4a2 2 0 0 0 2.8 2.8l6.4-6.4a4 4 0 0 0 5.6-5.6l-2.9 2.9-2.1-2.1z',
  photos: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  arrow: 'M5 12h14M12 5l7 7-7 7',
};

const Svg = ({ d, size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {(d || '').split('M').filter(Boolean).map((p, i) => <path key={i} d={`M${p}`} />)}
  </svg>
);

export default function JobSlot() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [techs, setTechs] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(() => {
    jobsApi.detail(id).then(({ job }) => setJob(job)).catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    load();
    jobsApi.technicians().then(({ technicians }) => setTechs(technicians)).catch(() => {});
  }, [load]);

  async function run(key, fn, msg) {
    setError(''); setNotice(''); setBusy(key);
    try { await fn(); setNotice(msg); load(); }
    catch (e) { setError(e.message); }
    finally { setBusy(''); }
  }

  if (error && !job) return <div className="card"><Alert tone="error">{error}</Alert></div>;
  if (!job) return <div className="card"><p className="muted">Loading…</p></div>;

  const fields = [
    { icon: 'customer', label: 'Customer', value: job.customer_name },
    { icon: 'phone', label: 'Phone', value: job.phone },
    { icon: 'route', label: 'Route', value: job.route || '—' },
    { icon: 'address', label: 'Address', value: job.address || '—' },
    { icon: 'ac', label: 'AC Unit', value: `${job.brand} / ${job.model}` },
    { icon: 'scheduled', label: 'Scheduled', value: job.scheduled_date },
    { icon: 'technician', label: 'Technician', value: job.technician_name || 'Unassigned', dim: !job.technician_name },
    { icon: 'photos', label: 'Photos', value: job.photo_count },
  ];
  if (job.postponed_from) {
    fields.push({ icon: 'clock', label: 'Postponed from', value: `${job.postponed_from} (${job.postpone_days}d)` });
  }

  return (
    <motion.div variants={pageStagger} initial="hidden" animate="visible">
      <motion.button {...tap} className="back-link" variants={listItem} onClick={() => navigate('/calendar')}>
        <span className="bl-ico"><Svg d={ICONS.arrow} size={16} /></span> Back to calendar
      </motion.button>

      {/* ---- Summary ---- */}
      <motion.div className="card job-head" variants={listItem}>
        <div className="row-between">
          <div>
            <span className="job-eyebrow">Job Detail</span>
            <h1 className="mono">{job.agreement_no}</h1>
          </div>
          <span className={`badge st-${job.status}`}>{job.status}</span>
        </div>

        <motion.div className="info-grid" variants={listContainer} initial="hidden" animate="visible">
          {fields.map((f) => (
            <motion.div className="info-tile" key={f.label} variants={listItem}
              whileHover={{ y: -2 }} transition={{ duration: motionTokens.duration.fast }}>
              <span className="info-ico"><Svg d={ICONS[f.icon]} /></span>
              <div className="info-body">
                <span className="info-label">{f.label}</span>
                <span className={`info-value${f.dim ? ' dim' : ''}`}>{f.value}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {error && <Alert key="err" tone="error">{error}</Alert>}
          {notice && <Alert key="ok" tone="ok">{notice}</Alert>}
        </AnimatePresence>
      </motion.div>

      {/* ---- Actions ---- */}
      <motion.div className="card" variants={listItem}>
        <h2 style={{ marginTop: 0 }}>Actions</h2>
        <div className="action-groups">
          <ActionGroup icon="technician" title="Assign Technician" desc="Set who will carry out this visit.">
            <AssignRow techs={techs} current={job.technician_id} busy={busy === 'assign'}
              onAssign={(tid) => run('assign', () => jobsApi.assign(id, tid), 'Technician assigned.')} />
          </ActionGroup>

          <ActionGroup icon="clock" title="Postpone Visit" desc="Push the scheduled date forward.">
            <PostponeRow busy={busy === 'postpone'}
              onPostpone={(days, reason) => run('postpone', () => jobsApi.postpone(id, days, reason), 'Job postponed.')} />
          </ActionGroup>

          <ActionGroup icon="photos" title="Comment" desc="Leave an internal note on this job.">
            <CommentRow value={job.comments || ''} busy={busy === 'comment'}
              onSave={(c) => run('comment', () => jobsApi.comment(id, c), 'Comment saved.')} />
          </ActionGroup>

          <ActionGroup icon="route" title="Cancel Job" desc="Mark this visit cancelled with a reason." tone="warn">
            <ReasonRow placeholder="Cancellation reason" label="Cancel job" danger busy={busy === 'cancel'}
              onSubmit={(reason) => run('cancel', () => jobsApi.cancel(id, reason), 'Job cancelled.')} />
          </ActionGroup>
        </div>

        {/* ---- Danger zone ---- */}
        <div className="danger-zone">
          <div className="dz-text">
            <strong>Soft-delete this job</strong>
            <span>Mistake correction — moves the job to Deleted Jobs. It is not permanently removed.</span>
          </div>
          <motion.button {...tap} className="secondary danger" disabled={busy === 'delete'} onClick={() => {
            if (confirm('Soft-delete this job? It will move to Deleted Jobs.')) run('delete', () => jobsApi.softDelete(id), 'Job soft-deleted.');
          }}>{busy === 'delete' ? 'Deleting…' : 'Delete'}</motion.button>
        </div>

      </motion.div>
    </motion.div>
  );
}

const pageStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function ActionGroup({ icon, title, desc, tone, children }) {
  return (
    <div className={`action-group${tone ? ` tone-${tone}` : ''}`}>
      <div className="ag-head">
        <span className="ag-ico"><Svg d={ICONS[icon]} size={16} /></span>
        <div>
          <span className="ag-title">{title}</span>
          <span className="ag-desc">{desc}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

function AssignRow({ techs, current, busy, onAssign }) {
  const [tid, setTid] = useState(current || '');
  return (
    <div className="action-controls">
      <select value={tid} onChange={(e) => setTid(e.target.value)}>
        <option value="">— select technician —</option>
        {techs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <motion.button {...tap} disabled={!tid || busy} onClick={() => onAssign(tid)}>{busy ? 'Assigning…' : 'Assign'}</motion.button>
    </div>
  );
}

function PostponeRow({ busy, onPostpone }) {
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState('');
  return (
    <div className="action-controls">
      <input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} className="ctl-days" aria-label="Days to postpone" />
      <input placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
      <motion.button {...tap} disabled={busy} onClick={() => onPostpone(Number(days), reason)}>{busy ? 'Postponing…' : 'Postpone'}</motion.button>
    </div>
  );
}

function ReasonRow({ label, placeholder, danger, busy, onSubmit }) {
  const [reason, setReason] = useState('');
  return (
    <div className="action-controls">
      <input placeholder={placeholder} value={reason} onChange={(e) => setReason(e.target.value)} />
      <motion.button {...tap} className={danger ? 'danger' : ''} disabled={busy} onClick={() => onSubmit(reason)}>{busy ? 'Cancelling…' : label}</motion.button>
    </div>
  );
}

function CommentRow({ value, busy, onSave }) {
  const [c, setC] = useState(value);
  return (
    <div className="action-controls">
      <input placeholder="Add a comment…" value={c} onChange={(e) => setC(e.target.value)} />
      <motion.button {...tap} className="secondary" disabled={busy} onClick={() => onSave(c)}>{busy ? 'Saving…' : 'Save'}</motion.button>
    </div>
  );
}
