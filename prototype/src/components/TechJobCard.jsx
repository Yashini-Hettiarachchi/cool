import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { tap } from '../lib/motion';

export default function TechJobCard({ job }) {
  const navigate = useNavigate();
  return (
    <motion.div {...tap} className="card clickable" onClick={() => navigate(`/technician/jobs/${job.id}`)}>
      <div className="row-between">
        <div>
          <span className="chip mono">{job.agreement_no}</span>
          <h3 style={{ margin: '6px 0 2px' }}>{job.customer_name}</h3>
          <p className="muted" style={{ margin: 0 }}>{job.customer_address}</p>
        </div>
        <span className={`badge-soft st-${job.status}`}>{job.status?.replace('_', ' ')}</span>
      </div>
    </motion.div>
  );
}
