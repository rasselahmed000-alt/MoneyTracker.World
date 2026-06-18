import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function NotificationPanel({ user, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    const load = async () => {
      try {
        const all = await base44.entities.AppNotification.list('-created_date', 50);
        const mine = all.filter(n => !n.target_email || n.target_email === user.email);
        setNotifications(mine);
      } catch (e) {}
      setLoading(false);
    };
    load();
  }, [user?.email]);

  const markRead = async (notif) => {
    const already = notif.is_read_by || [];
    if (already.includes(user.email)) return;
    await base44.entities.AppNotification.update(notif.id, {
      is_read_by: [...already, user.email],
    });
    setNotifications(prev => prev.map(n => n.id === notif.id
      ? { ...n, is_read_by: [...already, user.email] }
      : n
    ));
  };

  const unreadCount = notifications.filter(n => !(n.is_read_by || []).includes(user?.email)).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-[430px] h-full bg-white flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="bg-forest px-5 pt-12 pb-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-extrabold text-lg flex items-center gap-2">
              <Bell size={18} /> Notifications
            </h2>
            {unreadCount > 0 && (
              <p className="text-white/50 text-xs mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-white">
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center pt-12">
              <div className="w-6 h-6 border-2 border-forest/30 border-t-forest rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center pt-16 text-gray-400">
              <Bell size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-semibold text-sm">কোনো নোটিফিকেশন নেই</p>
            </div>
          ) : (
            notifications.map(n => {
              const isRead = (n.is_read_by || []).includes(user?.email);
              const dateStr = new Date(n.created_date).toLocaleString('en-BD', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true
              });
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => markRead(n)}
                  className="cursor-pointer rounded-2xl overflow-hidden shadow-sm border transition-all"
                  style={{
                    background: isRead ? '#fff' : '#f0fdf7',
                    borderColor: isRead ? '#e5e7eb' : 'rgba(11,61,46,0.15)',
                  }}
                >
                  {/* Image — full width, fixed height */}
                  {n.image_url && (
                    <div className="w-full h-44 overflow-hidden">
                      <img src={n.image_url} alt="notification" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-forest shrink-0 mt-0.5" />
                        )}
                        <p className={`font-extrabold text-sm leading-snug ${isRead ? 'text-gray-500' : 'text-gray-900'}`}>
                          {n.title}
                        </p>
                      </div>
                      {isRead && <CheckCheck size={14} className="text-gray-300 shrink-0 mt-0.5" />}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-100 mb-2" />

                    {/* Message — clean paragraph */}
                    <p className="text-[13px] text-gray-600 leading-relaxed">
                      {n.message}
                    </p>

                    {/* Timestamp */}
                    <p className="text-[10px] text-gray-400 font-medium mt-2.5 flex items-center gap-1">
                      🕐 {dateStr}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}