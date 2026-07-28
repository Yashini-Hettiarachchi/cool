/**
 * Shared UI primitives for the admin surface.
 * One visual language across pages: page headers, empty states, avatars,
 * status badges, and a single stroke icon set (Lucide-style, 1.8 stroke).
 */
import { motion } from 'motion/react';
import { motionTokens } from '../lib/motion';

/* ---- Icon set (paths split on "M" by <Svg>) ---- */
export const ICONS = {
  customer: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  search: 'M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  userPlus: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  tag: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01',
  trash: 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6',
  xCircle: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9l-6 6M9 9l6 6',
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z',
  idCard: 'M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM7 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4M14 12h4M14 16h2',
  pin: 'M12 22s8-4.5 8-11.8A8 8 0 0 0 4 10.2C4 17.5 12 22 12 22zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
  wrench: 'M14.7 6.3a4 4 0 0 0-5.6 5.6l-6.4 6.4a2 2 0 0 0 2.8 2.8l6.4-6.4a4 4 0 0 0 5.6-5.6l-2.9 2.9-2.1-2.1z',
  arrow: 'M5 12h14M12 5l7 7-7 7',
  ac: 'M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9L4.9 19.1',
  jobs: 'M20 7h-3V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v3H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM9 4h6v3H9z',
  /* Used by <Alert>. Colour alone can't carry "this failed" vs "this worked"
     (WCAG: never convey meaning by colour only), so each tone gets a glyph. */
  alert: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  check: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
};

export const Svg = ({ d, size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {(d || '').split('M').filter(Boolean).map((p, i) => <path key={i} d={`M${p}`} />)}
  </svg>
);

/* Page header: icon + title + subtitle on the left, actions on the right */
export function PageHeader({ icon, title, subtitle, children }) {
  return (
    <div className="page-head">
      <div className="ph-lead">
        {icon && <span className="ph-icon"><Svg d={ICONS[icon]} size={22} /></span>}
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="ph-sub">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="ph-actions">{children}</div>}
    </div>
  );
}

/* Empty / zero-data state */
export function EmptyState({ icon = 'inbox', title, hint, children }) {
  return (
    <motion.div className="empty-state"
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth }}>
      <span className="empty-ico"><Svg d={ICONS[icon]} size={26} /></span>
      <p className="empty-title">{title}</p>
      {hint && <p className="empty-hint">{hint}</p>}
      {children}
    </motion.div>
  );
}

/* Initials avatar (deterministic tint from the name) */
const AVATAR_TONES = ['brand', 'blue', 'amber', 'green', 'pink'];
export function Avatar({ name = '', size = 36 }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?';
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const tone = AVATAR_TONES[h % AVATAR_TONES.length];
  return (
    <span className={`avatar tone-${tone}`} style={{ width: size, height: size, fontSize: size * 0.4 }} aria-hidden="true">
      {initials}
    </span>
  );
}

/* Pill for roles / plain labels */
export function Pill({ children, tone }) {
  return <span className={`pill${tone ? ` tone-${tone}` : ''}`}>{children}</span>;
}

/**
 * Inline feedback banner.
 *
 * Replaces the bare `<p className="error">` used across the admin pages, which
 * rendered as 14px red text with no icon and nothing to announce it: easy to miss
 * next to a full-width form, and invisible to a screen reader. The technician
 * pages already used the `.alert` banner, so this also settles the two-styles
 * inconsistency in favour of the more legible one.
 *
 * tone="error" carries role="alert" (interrupt: something failed and needs
 * attention). tone="ok" carries role="status" (polite: confirmation only).
 */
export function Alert({ tone = 'error', children }) {
  if (!children) return null;
  const isError = tone === 'error';
  return (
    <motion.p
      className={`alert ${isError ? 'error' : 'ok'}`}
      role={isError ? 'alert' : 'status'}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Svg d={isError ? ICONS.alert : ICONS.check} size={16} />
      <span>{children}</span>
    </motion.p>
  );
}

/* Motion helpers for lists/table bodies */
export const rowContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
export const rowItem = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.26, ease: motionTokens.easing.smooth } },
};
