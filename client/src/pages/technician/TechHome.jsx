import { motion } from 'motion/react';
import { useAuth } from '../../auth/AuthContext';
import { Svg, ICONS } from '../../components/ui';
import { motionTokens } from '../../lib/motion';

const COMING = [
  { icon: 'calendar', title: "Today's jobs", desc: 'Your scheduled visits for the day, in route order.' },
  { icon: 'search', title: 'AS- search', desc: 'Pull up any job instantly by its AS- number.' },
  { icon: 'wrench', title: 'Start & complete', desc: 'Tag Normal / H-P work and send jobs to approval.' },
];

/** Placeholder technician home. Job search/photos/completion arrive in Phase 4. */
export default function TechHome() {
  const { user } = useAuth();
  return (
    <motion.div className="card"
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth }}>
      <div className="tech-hero">
        <span className="tech-hero-ico"><Svg d={ICONS.wrench} size={24} /></span>
        <div>
          <h1 style={{ margin: 0 }}>My Jobs</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>Signed in as <strong>{user.name}</strong> · Technician</p>
        </div>
      </div>

      <div className="form-note" style={{ marginTop: 18 }}>
        <span className="fn-ico"><Svg d={ICONS.wrench} size={16} /></span>
        <span>The technician workspace is coming in <b>Phase 4</b>. Here's what will land here:</span>
      </div>

      <motion.div className="info-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
        initial="hidden" animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}>
        {COMING.map((c) => (
          <motion.div key={c.title} className="info-tile"
            variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
            <span className="info-ico"><Svg d={ICONS[c.icon]} size={17} /></span>
            <div className="info-body">
              <span className="info-value" style={{ fontSize: 14 }}>{c.title}</span>
              <span className="info-label" style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>{c.desc}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
