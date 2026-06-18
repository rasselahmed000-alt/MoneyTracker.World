import { motion } from 'framer-motion';

// Lightweight: opacity-only, no translate — faster on low-end devices
const variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15 } },
  exit:    { opacity: 0, transition: { duration: 0.1 } },
};

export default function PageTransition({ children }) {
  return (
    <motion.div variants={variants} initial="initial" animate="animate" exit="exit" style={{ width: '100%' }}>
      {children}
    </motion.div>
  );
}