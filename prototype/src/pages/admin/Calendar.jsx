import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { jobsApi } from '../../api/jobs.api';
import { motionTokens } from '../../lib/motion';

const Chevron = ({ dir }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
  </svg>
);

const STATUS_CLASS = {
  scheduled: 'st-scheduled',
  in_progress: 'st-inprogress',
  postponed: 'st-postponed',
  completed: 'st-completed',
  cancelled: 'st-cancelled',
};

const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const LEGEND = [
  ['scheduled', 'Scheduled'],
  ['in_progress', 'In progress'],
  ['postponed', 'Postponed'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled']
];

export default function Calendar() {
  const navigate = useNavigate();
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const year = cursor.getFullYear();
  const monthIdx = cursor.getMonth();

  useEffect(() => {
    setLoading(true);
    jobsApi.getCalendar(year, monthIdx + 1)
      .then((data) => setJobs(data || []))
      .finally(() => setLoading(false));
  }, [year, monthIdx]);

  const byDay = useMemo(() => {
    const m = {};
    jobs.forEach((j) => {
      const day = Number(j.scheduled_date.slice(8, 10));
      (m[day] = m[day] || []).push(j);
    });
    return m;
  }, [jobs]);

  // Monday = 0, Sunday = 6
  const rawFirstDay = new Date(year, monthIdx, 1).getDay();
  const firstWeekday = (rawFirstDay + 6) % 7;
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  const now = new Date();
  const isThisMonth = now.getFullYear() === year && now.getMonth() === monthIdx;
  const todayDate = now.getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const counts = jobs.reduce((a, j) => { a[j.status] = (a[j.status] || 0) + 1; return a; }, {});
  const todayJobs = isThisMonth ? (byDay[todayDate] || []) : [];
  const upcoming = useMemo(() => {
    const ref = isThisMonth ? todayDate : 1;
    return jobs
      .filter((j) => Number(j.scheduled_date.slice(8, 10)) >= ref && j.status !== 'cancelled')
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
      .slice(0, 6);
  }, [jobs, isThisMonth, todayDate]);

  function move(delta) { const d = new Date(cursor); d.setMonth(d.getMonth() + delta); setCursor(d); }
  function goToday() { const d = new Date(); d.setDate(1); setCursor(d); }

  return (
    <div className="cal-layout">
      {/* ---- Calendar Card ---- */}
      <div className="card cal-card">
        <div className="cal-toolbar">
          <div className="cal-title">
            <h1>{cursor.toLocaleString('en', { month: 'long' })} <span className="cal-year">{year}</span></h1>
            <span className="cal-total">{jobs.length} visit{jobs.length === 1 ? '' : 's'}</span>
          </div>
          <div className="cal-nav">
            <button className="btn secondary cal-btn" onClick={() => move(-1)} aria-label="Previous month"><Chevron dir="left" /></button>
            <button className="btn secondary" onClick={goToday} disabled={isThisMonth}>Today</button>
            <button className="btn secondary cal-btn" onClick={() => move(1)} aria-label="Next month"><Chevron dir="right" /></button>
          </div>
        </div>

        {/* Month Banner Weekday Bar */}
        <div className="cal-weekhead">
          {WEEKDAYS.map((w) => <div key={w} className="cal-head">{w}</div>)}
        </div>

        {/* Month Box Grid */}
        <AnimatePresence mode="wait">
          <motion.div key={`${year}-${monthIdx}`} className="cal-grid"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: motionTokens.easing.smooth }}>
            {cells.map((d, i) => {
              const isToday = isThisMonth && d === todayDate;
              const dayJobs = d ? (byDay[d] || []) : [];
              return (
                <div key={i} className={`cal-cell ${d ? '' : 'empty'} ${isToday ? 'today' : ''}`}>
                  {d && (
                    <>
                      <div className="cal-day-row">
                        <span className="cal-day">{d}</span>
                        {dayJobs.length > 0 && <span className="cal-count">{dayJobs.length}</span>}
                      </div>
                      <div className="cal-jobs">
                        {dayJobs.slice(0, 3).map((j) => (
                          <motion.button key={j.id} className={`cal-job ${STATUS_CLASS[j.status] || ''}`}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(`/jobs/${j.id}`)} title={`${j.agreement_no} — ${j.customer_name} (${j.status})`}>
                            <span className="job-dot" /><span className="job-label">{j.customer_name}</span>
                          </motion.button>
                        ))}
                        {dayJobs.length > 3 && <span className="cal-more">+{dayJobs.length - 3} more</span>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {!loading && jobs.length === 0 && (
          <motion.div className="cal-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v4M16 2v4M3 10h18" /><rect x="3" y="4" width="18" height="18" rx="2" />
            </svg>
            <p>No visits scheduled in {cursor.toLocaleString('en', { month: 'long' })} {year}.</p>
            <button className="btn secondary" onClick={() => move(1)}>Check next month ›</button>
          </motion.div>
        )}
      </div>

      {/* ---- Side Panel ---- */}
      <aside className="cal-side">
        <div className="card side-today">
          <div className="side-label">{isThisMonth ? 'Today' : 'Viewing'}</div>
          <div className="side-today-date">{isThisMonth ? todayDate : cursor.toLocaleString('en', { month: 'short' })}</div>
          <div className="side-today-info">
            {isThisMonth
              ? now.toLocaleDateString('en', { weekday: 'long', month: 'long', year: 'numeric' })
              : `${cursor.toLocaleString('en', { month: 'long' })} ${year}`}
          </div>
          <div className="side-today-count">
            {isThisMonth
              ? `${todayJobs.length} visit${todayJobs.length === 1 ? '' : 's'} today`
              : `${jobs.length} visit${todayJobs.length === 1 ? '' : 's'} this month`}
          </div>
        </div>

        <div className="card side-list">
          <div className="side-label">Upcoming</div>
          {upcoming.map((j) => (
            <button key={j.id} className="side-item" onClick={() => navigate(`/jobs/${j.id}`)}>
              <span className={`side-stripe ${STATUS_CLASS[j.status]}`} />
              <span className="side-item-body">
                <span className="side-item-name">{j.customer_name}</span>
                <span className="side-item-sub"><span className="mono">{j.agreement_no}</span> · {j.scheduled_date.slice(5)}</span>
              </span>
            </button>
          ))}
          {upcoming.length === 0 && <p className="muted">No upcoming visits this month.</p>}
        </div>

        <div className="card side-legend">
          <div className="side-label">Status</div>
          {LEGEND.map(([key, label]) => (
            <div className="side-legend-row" key={key}>
              <span className={`dot ${STATUS_CLASS[key]}`} /><span>{label}</span><b>{counts[key] || 0}</b>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
