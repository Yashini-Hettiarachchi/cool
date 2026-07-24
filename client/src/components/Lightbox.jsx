import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

/**
 * In-window image lightbox. Render when `index` is a number.
 *   <Lightbox images={urls} index={i} onClose={...} onIndex={setI} />
 * Backdrop click / Esc closes; ← → (and on-screen chevrons) navigate.
 */
export default function Lightbox({ images = [], index, onClose, onIndex }) {
  const open = index != null && images.length > 0;

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && onIndex) onIndex(Math.min(index + 1, images.length - 1));
      if (e.key === 'ArrowLeft' && onIndex) onIndex(Math.max(index - 1, 0));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, index, images.length, onClose, onIndex]);

  const many = images.length > 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="lightbox" onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <button className="lb-close" onClick={onClose} aria-label="Close"><Icon d="M18 6L6 18M6 6l12 12" /></button>

          {many && (
            <button className="lb-nav lb-prev" disabled={index === 0}
              onClick={(e) => { e.stopPropagation(); onIndex(index - 1); }} aria-label="Previous">
              <Icon d="M15 18l-6-6 6-6" />
            </button>
          )}

          <motion.img key={index} className="lb-img" src={images[index]} alt={`Photo ${index + 1}`}
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }} />

          {many && (
            <button className="lb-nav lb-next" disabled={index === images.length - 1}
              onClick={(e) => { e.stopPropagation(); onIndex(index + 1); }} aria-label="Next">
              <Icon d="M9 18l6-6-6-6" />
            </button>
          )}

          {many && <div className="lb-count">{index + 1} / {images.length}</div>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
