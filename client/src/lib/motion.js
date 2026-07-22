/**
 * Shared motion tokens + reusable variants (motion/react).
 * Durations/easings tuned per the motion system; transforms + opacity only.
 */
export const motionTokens = {
  duration: { fast: 0.16, normal: 0.32, slow: 0.5 },
  easing: {
    smooth: [0.22, 1, 0.36, 1],
    sharp: [0.4, 0, 0.2, 1],
  },
  distance: { sm: 8, md: 16, lg: 24 },
};

// Page/route cross-fade
export const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: motionTokens.easing.smooth } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.16, ease: motionTokens.easing.sharp } },
};

// Stagger container + item for lists/cards
export const listContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
export const listItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: motionTokens.easing.smooth } },
};

// Button micro-interaction
export const tap = { whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 } };
