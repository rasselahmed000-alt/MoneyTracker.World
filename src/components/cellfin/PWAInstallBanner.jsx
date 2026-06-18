import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone, Star } from 'lucide-react';

const DISMISSED_KEY = 'mt_pwa_banner_dismissed';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    // User already dismissed
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner after 1.5s delay for better UX
      setTimeout(() => setShow(true), 1500);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShow(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      setShow(false);
    }
    setInstalling(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem(DISMISSED_KEY, '1');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[9998]"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div
            className="mx-3 mt-3 rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #0a2d20 0%, #0f4a32 50%, #0a2d20 100%)',
              border: '1px solid rgba(16,185,129,0.25)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(16,185,129,0.15)',
            }}
          >
            {/* Top accent line */}
            <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #10b981, #22c55e, #10b981, transparent)' }} />

            <div className="px-4 py-3.5 flex items-center gap-3">
              {/* App Icon */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.45)',
                }}
              >
                <span className="text-white font-black text-xl" style={{ lineHeight: 1 }}>৳</span>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-white font-black text-sm leading-tight">Money Tracker</p>
                  {/* Stars */}
                  <div className="flex gap-[1px]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={9} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  অফিসিয়াল অ্যাপ ইনস্টল করুন — দ্রুত ও নিরাপদ
                </p>
              </div>

              {/* Install Button */}
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={handleInstall}
                disabled={installing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-black text-xs shrink-0 transition-all"
                style={{
                  background: installing
                    ? 'rgba(16,185,129,0.3)'
                    : 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  boxShadow: installing ? 'none' : '0 3px 14px rgba(16,185,129,0.5)',
                  minWidth: 80,
                  justifyContent: 'center',
                }}
              >
                {installing ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Download size={12} strokeWidth={2.5} />
                    Install
                  </>
                )}
              </motion.button>

              {/* Close */}
              <button
                onClick={handleDismiss}
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <X size={13} color="rgba(255,255,255,0.5)" />
              </button>
            </div>

            {/* Bottom: features row */}
            <div
              className="px-4 pb-3 flex items-center gap-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              {[
                { icon: '⚡', text: 'Instant Access' },
                { icon: '🔒', text: 'Bank-level Security' },
                { icon: '📴', text: 'Works Offline' },
              ].map(f => (
                <div key={f.text} className="flex items-center gap-1 pt-2.5">
                  <span className="text-[10px]">{f.icon}</span>
                  <span className="text-[9px] font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}