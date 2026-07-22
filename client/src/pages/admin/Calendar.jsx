import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsApi } from '../../api/jobs.api';

const STATUS_CLASS = {
  scheduled: 'st-scheduled',
  in_progress: 'st-inprogress',
  postponed: 'st-postponed',
  completed: 'st-completed',
  cancelled: 'st-cancelled',
};
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ym(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }

export default function Calendar() {
  const navigate = useNavigate();
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');

  const month = ym(cursor);

  useEffect(() => {
    jobsApi.byMonth(month).then(({ jobs }) => setJobs(jobs)).catch((e) => setError(e.message));
  }, [month]);

  // Group jobs by day-of-month.
  const byDay = useMemo(() => {
    const m = {};
    jobs.forEach((j) => {
      const day = Number(j.scheduled_date.slice(8, 10));
      (m[day] = m[day] || []).push(j);
    });
    return m;
  }, [jobs]);

  const year = cursor.getFullYear();
  const monthIdx = cursor.getMonth();
  const firstWeekday = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  const counts = jobs.reduce((acc, j) => { acc[j.status] = (acc[j.status] || 0) + 1; return acc; }, {});

  function move(delta) {
    const d = new Date(cursor); d.setMonth(d.getMonth() + delta); setCursor(d);
  }

  return (
    <div className="card">
      <div className="row-between">
        <h1>Calendar</h1>
        <div className="cal-nav">
          <button className="secondary" onClick={() => move(-1)}>‹ Prev</button>
          <strong>{cursor.toLocaleString('en', { month: 'long' })} {year}</strong>
          <button className="secondary" onClick={() => move(1)}>Next ›</button>
        </div>
      </div>

      <div className="cal-legend">
        <span className="dot st-scheduled" /> Scheduled ({counts.scheduled || 0})
        <span className="dot st-postponed" /> Postponed ({counts.postponed || 0})
        <span className="dot st-completed" /> Completed ({counts.completed || 0})
        <span className="dot st-cancelled" /> Cancelled ({counts.cancelled || 0})
      </div>

      {error && <p className="error">{error}</p>}

      <div className="cal-grid">
        {WEEKDAYS.map((w) => <div key={w} className="cal-head">{w}</div>)}
        {cells.map((d, i) => (
          <div key={i} className={`cal-cell ${d ? '' : 'empty'}`}>
            {d && <>
              <div className="cal-day">{d}</div>
              {(byDay[d] || []).map((j) => (
                <button key={j.id} className={`cal-job ${STATUS_CLASS[j.status] || ''}`}
                  onClick={() => navigate(`/jobs/${j.id}`)} title={`${j.agreement_no} — ${j.customer_name}`}>
                  {j.agreement_no} · {j.customer_name}
                </button>
              ))}
            </>}
          </div>
        ))}
      </div>
    </div>
  );
}
