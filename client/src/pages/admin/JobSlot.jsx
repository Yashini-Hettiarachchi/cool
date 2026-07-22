import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobsApi } from '../../api/jobs.api';

export default function JobSlot() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [techs, setTechs] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(() => {
    jobsApi.detail(id).then(({ job }) => setJob(job)).catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    load();
    jobsApi.technicians().then(({ technicians }) => setTechs(technicians)).catch(() => {});
  }, [load]);

  async function run(fn, msg) {
    setError(''); setNotice('');
    try { await fn(); setNotice(msg); load(); }
    catch (e) { setError(e.message); }
  }

  if (error && !job) return <div className="card"><p className="error">{error}</p></div>;
  if (!job) return <div className="card"><p className="muted">Loading…</p></div>;

  return (
    <>
      <div className="card">
        <div className="row-between">
          <h1>Job — {job.agreement_no}</h1>
          <span className={`badge st-${job.status}`}>{job.status}</span>
        </div>
        <div className="detail-grid">
          <div><span className="muted">Customer</span><div>{job.customer_name}</div></div>
          <div><span className="muted">Phone</span><div>{job.phone}</div></div>
          <div><span className="muted">Route</span><div>{job.route || '—'}</div></div>
          <div><span className="muted">Address</span><div>{job.address || '—'}</div></div>
          <div><span className="muted">AC</span><div>{job.brand} / {job.model}</div></div>
          <div><span className="muted">Scheduled</span><div>{job.scheduled_date}</div></div>
          <div><span className="muted">Technician</span><div>{job.technician_name || 'Unassigned'}</div></div>
          <div><span className="muted">Photos</span><div>{job.photo_count}</div></div>
          {job.postponed_from && <div><span className="muted">Postponed from</span><div>{job.postponed_from} ({job.postpone_days}d)</div></div>}
        </div>
        {error && <p className="error">{error}</p>}
        {notice && <p className="notice">{notice}</p>}
      </div>

      <div className="card">
        <h2>Actions</h2>
        <AssignRow techs={techs} current={job.technician_id}
          onAssign={(tid) => run(() => jobsApi.assign(id, tid), 'Technician assigned.')} />
        <PostponeRow onPostpone={(days, reason) => run(() => jobsApi.postpone(id, days, reason), 'Job postponed.')} />
        <ReasonRow label="Cancel job" placeholder="Cancellation reason" danger
          onSubmit={(reason) => run(() => jobsApi.cancel(id, reason), 'Job cancelled.')} />
        <CommentRow value={job.comments || ''}
          onSave={(c) => run(() => jobsApi.comment(id, c), 'Comment saved.')} />
        <div className="action-row">
          <span>Soft-delete (mistake correction — moves to Deleted Jobs)</span>
          <button className="secondary danger" onClick={() => {
            if (confirm('Soft-delete this job? It will move to Deleted Jobs.')) run(() => jobsApi.softDelete(id), 'Job soft-deleted.');
          }}>Delete</button>
        </div>
        <div className="form-actions"><button className="secondary" onClick={() => navigate('/calendar')}>← Back to calendar</button></div>
      </div>
    </>
  );
}

function AssignRow({ techs, current, onAssign }) {
  const [tid, setTid] = useState(current || '');
  return (
    <div className="action-row">
      <select value={tid} onChange={(e) => setTid(e.target.value)}>
        <option value="">— select technician —</option>
        {techs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <button disabled={!tid} onClick={() => onAssign(tid)}>Assign</button>
    </div>
  );
}

function PostponeRow({ onPostpone }) {
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState('');
  return (
    <div className="action-row">
      <input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} style={{ width: 90 }} />
      <input placeholder="Postpone reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      <button onClick={() => onPostpone(Number(days), reason)}>Postpone</button>
    </div>
  );
}

function ReasonRow({ label, placeholder, danger, onSubmit }) {
  const [reason, setReason] = useState('');
  return (
    <div className="action-row">
      <input placeholder={placeholder} value={reason} onChange={(e) => setReason(e.target.value)} />
      <button className={danger ? 'danger' : ''} onClick={() => onSubmit(reason)}>{label}</button>
    </div>
  );
}

function CommentRow({ value, onSave }) {
  const [c, setC] = useState(value);
  return (
    <div className="action-row">
      <input placeholder="Comment" value={c} onChange={(e) => setC(e.target.value)} />
      <button className="secondary" onClick={() => onSave(c)}>Save comment</button>
    </div>
  );
}
