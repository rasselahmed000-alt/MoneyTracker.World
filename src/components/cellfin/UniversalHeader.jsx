import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Universal Header Component
 * Safe Area Aware, Fixed Position, Consistent across all pages
 * 
 * Props:
 * - title: string — page title
 * - subtitle: string (optional) — subtitle in bangla
 * - onBack: function (optional) — custom back handler
 * - rightAction: ReactNode (optional) — right side action button/icon
 * - gradient: string (optional) — gradient background
 */
export default function UniversalHeader({
  title,
  subtitle,
  onBack,
  rightAction,
  gradient = 'linear-gradient(135deg, #0b3d2e 0%, #0f5132 100%)',
  showBack = true,
}) {
  const navigate = useNavigate();

  const handleBack = onBack ? onBack : () => navigate(-1);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-40 w-full"
      style={{
        background: gradient,
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: '1rem',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
      }}
    >
      <div className="max-w-[430px] mx-auto flex items-center gap-3">
        {/* Back Button */}
        {showBack && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleBack}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <ArrowLeft size={18} className="text-white" />
          </motion.button>
        )}

        {/* Title Section */}
        <div className="flex-1 min-w-0">
          <h1 className="text-white font-extrabold text-lg leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-white/50 text-xs mt-0.5 truncate">{subtitle}</p>
          )}
        </div>

        {/* Right Action */}
        {rightAction && <div className="shrink-0">{rightAction}</div>}
      </div>
    </motion.header>
  );
}