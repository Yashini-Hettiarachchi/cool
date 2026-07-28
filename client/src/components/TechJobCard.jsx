import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Svg, ICONS } from './ui';

/** Map a DB status to its badge CSS suffix (in_progress → inprogress). */
export const statusClass = (s) => `st-${(s || '').replace('_', '')}`;
export const statusLabel = (s) => (s || '').replace('_', ' ');

/** Format an ISO/date string as e.g. "Mon, 20 Oct". */
export function shortDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d).slice(0, 10);
  return dt.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * Large touch-friendly job card for the technician screens.
 * Tapping navigates to the technician job detail.
 */
export default function TechJobCard({ job, variants }) {
  const nav = useNavigate();
  return (
    <motion.button
      type="button"
      className={`tjob-card ${statusClass(job.status)}`}
      variants={variants}
      whileTap={{ scale: 0.98 }}
      onClick={() => nav(`/technician/jobs/${job.id}`)}
    >
      <div className="tjob-top">
        <span className="tjob-as">{job.agreement_no}</span>
        <span className={`badge-soft ${statusClass(job.status)}`}>{statusLabel(job.status)}</span>
      </div>
      <div className="tjob-name">{job.customer_name}</div>
      <div className="tjob-meta">
        <span><Svg d={ICONS.calendar} size={14} /> {shortDate(job.scheduled_date)}</span>
        {job.route && <span><Svg d={ICONS.pin} size={14} /> {job.route}</span>}
      </div>
      <span className="tjob-go"><Svg d={ICONS.arrow} size={18} /></span>
    </motion.button>
  );
}
