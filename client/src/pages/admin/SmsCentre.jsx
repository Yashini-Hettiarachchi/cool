/**
 * SMS Centre (Phase 5) — the office's view of everything that gets texted.
 *
 * Three tabs:
 *   Templates — edit the wording of the three automatic messages. The client
 *               hadn't finalised it at build time, so it lives in the DB rather
 *               than in code (phase-05 issue #5).
 *   History   — every message the system has recorded, including why one failed.
 *   Reminders — who tomorrow's cron would text, checkable before 08:00.
 *
 * The "send a test" box is the only way to prove the Text.lk credentials work
 * before a real customer depends on them.
 */
import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { smsApi } from '../../api/sms.api';
import { useAuth } from '../../auth/AuthContext';
import { PageHeader, EmptyState, Alert, Pill, rowContainer, rowItem } from '../../components/ui';
import Pagination, { paginate } from '../../components/Pagination';

const TYPE_LABEL = {
  activation: 'Agreement activated',
  reminder: 'Visit reminder',
  completion: 'Service completed',
};

const TYPE_WHEN = {
  activation: 'Sent the moment a new agreement is registered.',
  reminder: 'Sent by the daily cron, the day before a scheduled visit.',
  completion: 'Sent when the office approves a completed visit — not when the technician taps Complete.',
};

/** Rough GSM-7 segment maths — enough to warn before a 3-part message. */
function segments(text) {
  const len = (text || '').length;
  return len <= 160 ? 1 : Math.ceil(len / 153);
}

const PER_PAGE = 15;

export default function SmsCentre() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tab, setTab] = useState('templates');
  const [enabled, setEnabled] = useState(null);

  return (
    <div>
      <PageHeader icon="phone" title="SMS Centre"
        subtitle="Message wording, delivery history, and tomorrow's reminder batch.">
        {enabled !== null && (
          <Pill tone={enabled ? 'green' : 'muted'}>{enabled ? 'Live sending on' : 'Log-only mode'}</Pill>
        )}
      </PageHeader>

      {enabled === false && (
        <Alert tone="error">
          Messages are being written to the server log but not delivered. Set SMS_ENABLED=true and a
          TEXTLK_API_KEY in the server’s .env file to send for real.
        </Alert>
      )}

      <div className="seg" style={{ marginBottom: 16 }}>
        <button type="button" className={tab === 'templates' ? 'active' : ''} onClick={() => setTab('templates')}>Templates</button>
        <button type="button" className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>History</button>
        <button type="button" className={tab === 'reminders' ? 'active' : ''} onClick={() => setTab('reminders')}>Reminders</button>
      </div>

      {tab === 'templates' && <Templates isAdmin={isAdmin} onEnabled={setEnabled} />}
      {tab === 'history' && <History />}
      {tab === 'reminders' && <Reminders />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

function Templates({ isAdmin, onEnabled }) {
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    smsApi.templates()
      .then(({ templates, enabled }) => { setTemplates(templates); onEnabled(enabled); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [onEnabled]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="card"><p className="muted">Loading templates…</p></div>;
  if (error) return <div className="card"><Alert tone="error">{error}</Alert></div>;

  return (
    <>
      {templates.map((t) => <TemplateEditor key={t.type} template={t} isAdmin={isAdmin} onSaved={load} />)}
      {isAdmin
        ? <TestSend />
        : <p className="muted">Only an administrator can change message wording or send a test.</p>}
    </>
  );
}

/**
 * Local preview of an unsaved edit. The server returns a rendered preview for
 * the saved body; while typing we substitute the same sample values client-side
 * so the box updates on every keystroke instead of only after a save.
 */
const SAMPLE = { name: 'Nimal Perera', agreementNo: 'AS-00042', date: '2026-08-14' };
function previewOf(body, template) {
  if (body === template.body) return template.preview;
  return body.replace(/\{(\w+)\}/g, (m, k) => (SAMPLE[k] === undefined ? m : SAMPLE[k]));
}

function TemplateEditor({ template, isAdmin, onSaved }) {
  const [body, setBody] = useState(template.body);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => { setBody(template.body); }, [template.body]);

  const dirty = body !== template.body;
  const parts = segments(body);

  async function run(key, fn, msg) {
    setBusy(key); setError(''); setNotice('');
    try { await fn(); setNotice(msg); onSaved(); }
    catch (e) { setError(e.message); }
    finally { setBusy(''); }
  }

  return (
    <div className="card sms-template">
      <div className="row-between">
        <div>
          <h2 style={{ margin: 0 }}>{TYPE_LABEL[template.type]}</h2>
          <p className="muted" style={{ margin: '2px 0 0' }}>{TYPE_WHEN[template.type]}</p>
        </div>
        {template.is_custom && <Pill tone="brand">Customised</Pill>}
      </div>

      <textarea className="sms-body" rows={3} value={body} disabled={!isAdmin}
        onChange={(e) => setBody(e.target.value)}
        aria-label={`${TYPE_LABEL[template.type]} message body`} />

      <div className="sms-meta">
        <span className="sms-tokens">
          Placeholders:{' '}
          {template.placeholders.map((p) => (
            <button key={p} type="button" className="sms-token" disabled={!isAdmin}
              onClick={() => setBody((b) => `${b}{${p}}`)} title={`Insert {${p}}`}>
              {`{${p}}`}
            </button>
          ))}
        </span>
        <span className={`sms-count${parts > 2 ? ' warn' : ''}`}>{body.length} chars · {parts} SMS</span>
      </div>

      <div className="sms-preview">
        <span className="sms-preview-label">Preview</span>
        <p>{previewOf(body, template)}</p>
      </div>

      <AnimatePresence mode="wait">
        {error && <Alert key="e" tone="error">{error}</Alert>}
        {notice && <Alert key="n" tone="ok">{notice}</Alert>}
      </AnimatePresence>

      {isAdmin && (
        <div className="action-controls">
          <button disabled={!dirty || busy === 'save' || !body.trim()}
            onClick={() => run('save', () => smsApi.saveTemplate(template.type, body), 'Wording saved.')}>
            {busy === 'save' ? 'Saving…' : 'Save wording'}
          </button>
          <button className="secondary" disabled={busy === 'reset' || (!template.is_custom && !dirty)}
            onClick={() => {
              if (!template.is_custom) { setBody(template.body); return; }
              if (confirm('Restore the default wording for this message?')) {
                run('reset', () => smsApi.resetTemplate(template.type), 'Default wording restored.');
              }
            }}>
            {busy === 'reset' ? 'Restoring…' : template.is_custom ? 'Restore default' : 'Discard changes'}
          </button>
        </div>
      )}
    </div>
  );
}

function TestSend() {
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('reminder');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function send() {
    setBusy(true); setError(''); setResult(null);
    try { setResult(await smsApi.test(phone, type)); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  const heading = result && (
    result.status === 'sent' ? 'Accepted by Text.lk'
      : result.status === 'logged' ? 'Logged only — live sending is off'
        : 'Failed'
  );

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Send a test message</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Sends one message to a number you choose, using sample data. It is <strong>not</strong> written to the
        customer history — this is how you prove the Text.lk key and sender ID work before going live.
      </p>
      <div className="action-controls">
        <input placeholder="07XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)}
          aria-label="Test recipient number" />
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Template to test">
          {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button disabled={!phone.trim() || busy} onClick={send}>{busy ? 'Sending…' : 'Send test'}</button>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {result && (
        <div className={`sms-result sms-st-${result.status}`}>
          <strong>{heading}</strong>
          <span>To {result.recipient} — {result.detail}</span>
          <span className="sms-result-msg">“{result.message}”</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* History                                                             */
/* ------------------------------------------------------------------ */

function History() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({ type: '', status: '', q: '' });
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError('');
    smsApi.logs(filters)
      .then(({ logs, stats }) => { if (alive) { setLogs(logs); setStats(stats); setPage(0); } })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [filters]);

  const pg = paginate(logs, page, PER_PAGE);

  return (
    <div className="card">
      <div className="sms-hist-head">
        <div className="sms-stats">
          <Stat label="Total" value={stats.total || 0} />
          <Stat label="Sent" value={stats.sent || 0} tone="green" />
          <Stat label="Log-only" value={stats.logged || 0} />
          <Stat label="Failed" value={stats.failed || 0} tone="red" />
        </div>
        <div className="sms-filters">
          <input placeholder="Search name, phone or text…" value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} aria-label="Search messages" />
          <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
            aria-label="Filter by message type">
            <option value="">All types</option>
            {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="sent">Sent</option>
            <option value="logged">Log-only</option>
            <option value="failed">Failed</option>
            <option value="skipped-no-phone">No phone</option>
          </select>
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {loading && <p className="muted">Loading history…</p>}

      {!loading && !logs.length && !error && (
        <EmptyState icon="inbox" title="No messages yet"
          hint="Activation, reminder and completion messages appear here as they go out." />
      )}

      {!loading && !!logs.length && (
        <>
          <table className="table">
            <thead>
              <tr><th>When</th><th>Customer</th><th>Type</th><th>Message</th><th>Status</th></tr>
            </thead>
            <motion.tbody variants={rowContainer} initial="hidden" animate="visible">
              {pg.slice.map((l) => (
                <motion.tr key={l.id} variants={rowItem}>
                  <td className="mono">{String(l.sent_at || '').replace('T', ' ').slice(0, 16)}</td>
                  <td>
                    <div>{l.customer_name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {l.phone}{l.agreement_no ? ` · ${l.agreement_no}` : ''}
                    </div>
                  </td>
                  <td>{TYPE_LABEL[l.template_type] || l.template_type}</td>
                  <td className="sms-msg-cell">{l.message}</td>
                  <td><span className={`badge sms-st-${l.status}`}>{l.status}</span></td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
          <Pagination {...pg} onPage={setPage} unit="messages" />
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className={`sms-stat${tone ? ` tone-${tone}` : ''}`}>
      <span className="sms-stat-v">{value}</span>
      <span className="sms-stat-l">{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reminders                                                           */
/* ------------------------------------------------------------------ */

function Reminders() {
  const [date, setDate] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError('');
    smsApi.remindersPreview(date)
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [date]);

  return (
    <div className="card">
      <div className="row-between">
        <div>
          <h2 style={{ margin: 0 }}>Reminder batch</h2>
          <p className="muted" style={{ margin: '2px 0 0' }}>
            Who the daily 08:00 cron would text for visits on this date. Defaults to tomorrow.
          </p>
        </div>
        <input type="date" value={date || data?.date || ''} onChange={(e) => setDate(e.target.value)}
          aria-label="Visit date" />
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {loading && <p className="muted">Loading…</p>}

      {!loading && data && !data.jobs.length && !error && (
        <EmptyState icon="calendar" title="Nothing scheduled"
          hint={`No visits are booked for ${data.date}, so no reminders would go out.`} />
      )}

      {!loading && data && !!data.jobs.length && (
        <table className="table">
          <thead>
            <tr><th>Agreement</th><th>Customer</th><th>Phone</th><th>Visit status</th><th>Reminder</th></tr>
          </thead>
          <tbody>
            {data.jobs.map((j) => (
              <tr key={j.id}>
                <td className="mono">{j.agreement_no}</td>
                <td>{j.customer_name}</td>
                <td>{j.phone || <span className="muted">none on file</span>}</td>
                <td>{j.status}</td>
                <td>
                  {!j.has_phone
                    ? <span className="badge sms-st-skipped-no-phone">will skip</span>
                    : j.already_sent
                      ? <span className="badge sms-st-logged">already handled</span>
                      : <span className="badge sms-st-sent">will send</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
