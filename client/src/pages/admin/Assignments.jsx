import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { jobsApi } from '../../api/jobs.api';
import { PageHeader, EmptyState, Pill, Svg, ICONS, Alert, rowContainer, rowItem } from '../../components/ui';
import Pagination, { paginate } from '../../components/Pagination';

const fmt = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? String(d).slice(0, 10)
    : dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function Assignments() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [techs, setTechs] = useState([]);
  const [filter, setFilter] = useState('unassigned'); // 'unassigned' | 'all'
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  async function load() {
    setError(''); setBusy(true);
    try {
      const [{ jobs }, { technicians }] = await Promise.all([jobsApi.toAssign(), jobsApi.technicians()]);
      setJobs(jobs || []);
      setTechs(technicians || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function assign(jobId, technicianId) {
    setSavingId(jobId); setError('');
    try {
      const { job } = await jobsApi.assign(jobId, technicianId);
      // update the row in place
      setJobs((list) => list.map((j) => (j.id === jobId
        ? { ...j, technician_id: job.technician_id, technician_name: job.technician_name } : j)));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  const shown = useMemo(
    () => (filter === 'unassigned' ? jobs.filter((j) => !j.technician_id) : jobs),
    [jobs, filter]
  );
  const unassignedCount = useMemo(() => jobs.filter((j) => !j.technician_id).length, [jobs]);

  return (
    <div className="card">
      <PageHeader icon="jobs" title="Assignments"
        subtitle={busy ? 'Loading…' : `${unassignedCount} unassigned · ${jobs.length} upcoming visit${jobs.length === 1 ? '' : 's'}`} />

      <div className="seg" style={{ marginBottom: 16 }}>
        <button type="button" className={filter === 'unassigned' ? 'active' : ''} onClick={() => { setFilter('unassigned'); setPage(0); }}>
          Unassigned{unassignedCount ? ` (${unassignedCount})` : ''}
        </button>
        <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => { setFilter('all'); setPage(0); }}>
          All upcoming
        </button>
      </div>

      <Alert tone="error">{error}</Alert>

      {!busy && shown.length === 0 && (
        <EmptyState icon="calendar"
          title={filter === 'unassigned' ? 'Everything is assigned' : 'No upcoming visits'}
          hint={filter === 'unassigned'
            ? 'Every upcoming visit already has a technician. Switch to "All upcoming" to reassign.'
            : 'Upcoming scheduled visits will appear here as agreements are created.'} />
      )}

      {!busy && shown.length > 0 && (() => {
        const pg = paginate(shown, page, 12);
        return (
        <>
        <table className="table">
          <thead>
            <tr><th>Date</th><th>Customer</th><th>AS-</th><th>AC Unit</th><th>Route</th><th>Technician</th></tr>
          </thead>
          <motion.tbody variants={rowContainer} initial="hidden" animate="visible">
            {pg.slice.map((j) => (
              <motion.tr key={j.id} variants={rowItem}>
                <td>{fmt(j.scheduled_date)}</td>
                <td>
                  <button className="link" onClick={() => navigate(`/customers/${j.customer_id}`)}>{j.customer_name}</button>
                </td>
                <td><span className="as-chip">{j.agreement_no}</span></td>
                <td>{[j.brand, j.model].filter(Boolean).join(' ') || '—'}</td>
                <td>{j.route || '—'}</td>
                <td>
                  <div className="assign-cell">
                    <select
                      value={j.technician_id || ''}
                      disabled={savingId === j.id}
                      onChange={(e) => assign(j.id, Number(e.target.value))}
                    >
                      <option value="" disabled>Assign…</option>
                      {techs.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    {j.technician_id
                      ? <Pill tone="green">Assigned</Pill>
                      : <Pill tone="brand">Needs tech</Pill>}
                  </div>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
        <Pagination {...pg} onPage={setPage} unit="visits" />
        </>
        );
      })()}
    </div>
  );
}
