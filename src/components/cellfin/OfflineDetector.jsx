import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi } from 'lucide-react';

export default function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}
        >
          <div className="text-center px-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(59, 130, 246, 0.15)' }}>
              <Wifi size={40} className="text-blue-400" />
            </div>
            
            <h2 className="text-white font-black text-2xl mb-2">No Internet Connection</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-8">
              Your connection appears to be offline. Please check your network and try again.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-6 py-3 rounded-2xl font-bold text-sm transition-all"
                style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff' }}
              >
                Retry
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}