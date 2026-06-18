import { motion } from 'framer-motion';

// Lightweight skeleton placeholder — replaces heavy loading spinners
export const SkeletonCard = ({ count = 1, height = 80 }) => (
  <>
    {Array(count).fill(0).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
        className="rounded-2xl bg-gradient-to-r from-slate-200 to-slate-100"
        style={{ height: `${height}px` }}
      />
    ))}
  </>
);

export const SkeletonLine = ({ width = '100%', height = 12 }) => (
  <motion.div
    initial={{ opacity: 0.5 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
    className="rounded-full bg-gradient-to-r from-slate-200 to-slate-100"
    style={{ width, height: `${height}px` }}
  />
);

export const SkeletonText = () => (
  <div className="space-y-2">
    <SkeletonLine width="70%" />
    <SkeletonLine width="100%" height={8} />
    <SkeletonLine width="85%" height={8} />
  </div>
);

// Lightweight input skeleton
export const SkeletonInput = ({ count = 1 }) => (
  <div className="space-y-3">
    {Array(count).fill(0).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
        className="h-12 rounded-2xl bg-gradient-to-r from-slate-200 to-slate-100"
      />
    ))}
  </div>
);