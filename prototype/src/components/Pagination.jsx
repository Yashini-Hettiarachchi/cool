import { motion } from 'motion/react';

export default function Pagination({ page = 1, totalPages = 1, total = 0, limit = 10, onChange }) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="pagination">
      <span className="pg-range">Showing {start}–{end} of {total}</span>
      <div className="pg-controls">
        <motion.button className="pg-nav" disabled={page <= 1} onClick={() => onChange(page - 1)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          ‹
        </motion.button>
        <span className="pg-num active">{page}</span>
        <motion.button className="pg-nav" disabled={page >= totalPages} onClick={() => onChange(page + 1)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          ›
        </motion.button>
      </div>
    </div>
  );
}
