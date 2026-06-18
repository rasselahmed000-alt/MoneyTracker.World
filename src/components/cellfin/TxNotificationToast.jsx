import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, XCircle, X } from 'lucide-react';

/**
 * Props:
 *   notification: { id, status, amount, currency, type, description }
 *   onClose: fn
 */
export default function TxNotificationToast({ notification, onClose }) {
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [notification]);

  if (!notification) return null;

  const cfg = {
    success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200', label: '✅ সফল হয়েছে!' },
    pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200', label: '⏳ প্রসেস হচ্ছে...' },
    failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 border-red-200', label: '❌ ব্যর্থ হয়েছে' },
  }[notification.status] || { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200', label: '⏳ প্রসেস হচ্ছে...' };

  const Icon = cfg.icon;

  return (
    <AnimatePresence>
      <motion.div
        key={notification.id}
        initial={{ opacity: 0, y: -60, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -60, scale: 0.9 }}
        transition={{ type: 'spring', bounce: 0.4 }}
        className={`fixed top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-[999] ${cfg.bg} border rounded-2xl shadow-xl px-4 py-3 flex items-start gap-3`}
      >
        <Icon size={22} className={`${cfg.color} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-sm text-foreground">{cfg.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {notification.description || notification.type} — {notification.amount} {notification.currency}
          </p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0">
          <X size={16} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}