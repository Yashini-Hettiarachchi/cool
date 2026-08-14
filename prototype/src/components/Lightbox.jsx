import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function Lightbox({ photos = [], index = 0, onClose, onNavigate }) {
  const current = photos[index];

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1);
    if (e.key === 'ArrowRight' && index < photos.length - 1) onNavigate(index + 1);
  }, [index, photos.length, onClose, onNavigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  if (!current) return null;

  return (
    <AnimatePresence>
      <div className="lightbox" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
          <img src={current.photo_path || current} alt="Job photo" className="lb-img" />
          <button className="lb-close" onClick={onClose}>✕</button>
          {photos.length > 1 && (
            <>
              <button className="lb-nav lb-prev" disabled={index <= 0} onClick={() => onNavigate(index - 1)}>‹</button>
              <button className="lb-nav lb-next" disabled={index >= photos.length - 1} onClick={() => onNavigate(index + 1)}>›</button>
              <span className="lb-count">{index + 1} / {photos.length}</span>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
