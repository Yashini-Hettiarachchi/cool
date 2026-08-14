import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsApi } from '../../api/jobs.api';

export default function Calendar() {
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    jobsApi.getCalendar(year, month).then(setJobs);
  }, [year, month]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  const prevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else { setMonth(month - 1); }
  };
  const nextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else { setMonth(month + 1); }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div style={{ height: 'calc(100vh - 120px)' }}>
      <div className="cal-card card">
        <div className="cal-toolbar row-between">
          <div className="cal-title">
            <h1>{monthNames[month - 1]} <span className="cal-year">{year}</span></h1>
            <span className="cal-total">{jobs.length} visits this month</span>
          </div>
          <div className="cal-nav">
            <button className="cal-btn btn secondary" onClick={prevMonth}>‹</button>
            <button className="cal-btn btn secondary" onClick={nextMonth}>›</button>
          </div>
        </div>

        <div className="cal-legend">
          <span className="legend-pill"><span className="dot st-scheduled"></span> Scheduled</span>
          <span className="legend-pill"><span className="dot st-inprogress"></span> In Progress</span>
          <span className="legend-pill"><span className="dot st-completed"></span> Completed</span>
          <span className="legend-pill"><span className="dot st-postponed"></span> Postponed</span>
        </div>

        <div className="cal-weekhead">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="cal-head">{d}</div>
          ))}
        </div>

        <div className="cal-grid">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="cal-cell empty"></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayJobs = jobs.filter(j => j.scheduled_date === dateStr);
            const isToday = dateStr === today.toISOString().slice(0, 10);

            return (
              <div key={dayNum} className={`cal-cell ${isToday ? 'today' : ''}`}>
                <div className="cal-day-row">
                  <span className="cal-day">{dayNum}</span>
                  {dayJobs.length > 0 && <span className="cal-count">{dayJobs.length}</span>}
                </div>
                <div className="cal-jobs">
                  {dayJobs.map(j => (
                    <button
                      key={j.id}
                      className={`cal-job st-${j.status}`}
                      onClick={() => navigate(`/jobs/${j.id}`)}
                      title={`${j.customer_name} (${j.agreement_no})`}
                    >
                      <span className="job-dot"></span>
                      <span className="job-label">{j.customer_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
