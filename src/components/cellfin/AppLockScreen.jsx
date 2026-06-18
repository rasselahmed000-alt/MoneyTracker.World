import { useState, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Eye, EyeOff, LogOut, Delete } from 'lucide-react';

// ─── Session helpers ───────────────────────────────────────
const SESSION_UNLOCKED_KEY = 'mt_pin_unlocked';
const LAST_ACTIVE_KEY      = 'mt_last_active';
const BG_LOCK_TIMEOUT_MS   = 5 * 60 * 1000;

export function markSessionUnlocked() { sessionStorage.setItem(SESSION_UNLOCKED_KEY, '1'); }
export function isSessionLocked()     { return sessionStorage.getItem(SESSION_UNLOCKED_KEY) !== '1'; }
export function recordActivity()      { localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString()); }

export function checkBackgroundLock() {
  const last = parseInt(localStorage.getItem(LAST_ACTIVE_KEY) || '0');
  if (!last) return false;
  if (Date.now() - last > BG_LOCK_TIMEOUT_MS) {
    sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
    return true;
  }
  return false;
}

// ── PIN Dots ─────────────────────────────────────────────
const PinDots = memo(function PinDots({ value, shake }) {
  return (
    <motion.div
      className="flex gap-4 justify-center my-4"
      animate={shake ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
      transition={{ duration: 0.42 }}
    >
      {Array(4).fill(0).map((_, i) => (
        <motion.div
          key={i}
          animate={{ scale: i === value.length - 1 ? [1, 1.35, 1] : 1 }}
          transition={{ duration: 0.15 }}
          className="rounded-full border-2 transition-all duration-200"
          style={{
            width: 16, height: 16,
            background: i < value.length ? '#0b3d2e' : 'transparent',
            borderColor: i < value.length ? '#0b3d2e' : '#cbd5e1',
          }}
        />
      ))}
    </motion.div>
  );
});

// ── Number Pad ───────────────────────────────────────────
const NumPad = memo(function NumPad({ onPress, onDelete, loading }) {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, '⌫'];
  return (
    <div className="grid grid-cols-3 gap-3 px-6">
      {keys.map((k, i) => {
        if (k === null) return <div key={i} />;
        const isDel = k === '⌫';
        return (
          <motion.button
            key={i}
            whileTap={{ scale: 0.90 }}
            disabled={loading}
            onClick={() => isDel ? onDelete() : onPress(String(k))}
            className="h-16 rounded-2xl font-bold text-2xl flex items-center justify-center transition-all disabled:opacity-50 select-none"
            style={{
              background: isDel ? '#fee2e2' : '#ffffff',
              color: isDel ? '#ef4444' : '#1a3a2a',
              border: '1.5px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            {isDel ? <Delete size={20} color="#ef4444" /> : k}
          </motion.button>
        );
      })}
    </div>
  );
});

// ── Main Component ────────────────────────────────────────
export default memo(function AppLockScreen({ user, onUnlock }) {
  const [pin, setPin]               = useState('');
  const [error, setError]           = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  const [shake, setShake]           = useState(false);
  const [loading, setLoading]       = useState(false);
  const [blocked, setBlocked]       = useState(false);
  const [blockTimer, setBlockTimer] = useState(0);
  const [showPin, setShowPin]       = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const name    = user?.full_name || user?.email || 'User';
  const initial = name[0]?.toUpperCase();
  const firstName = name.split(' ')[0];

  useEffect(() => {
    if (blockTimer <= 0) return;
    const t = setInterval(() => setBlockTimer(p => {
      if (p <= 1) { clearInterval(t); setBlocked(false); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [blockTimer]);

  const doError = (msg) => {
    setError(msg); setShake(true); setPin('');
    setTimeout(() => setShake(false), 500);
  };

  const verifyPin = useCallback(async (entered) => {
    if (blocked) return;
    setLoading(true); setError('');
    try {
      const res = await base44.functions.invoke('verifyPin', { pin: entered });
      if (res.data?.success) {
        markSessionUnlocked(); recordActivity(); onUnlock();
      } else if (res.data?.blocked) {
        setBlocked(true); setAttemptsLeft(0);
        setBlockTimer(res.data?.remaining_seconds || 300);
        doError(res.data?.error || 'Too many attempts.');
      } else {
        const rem = res.data?.attempts_remaining;
        if (rem !== undefined) setAttemptsLeft(rem);
        doError(res.data?.error || 'ভুল PIN! আবার চেষ্টা করুন।');
      }
    } catch { doError('যাচাই করতে ব্যর্থ হয়েছে।'); }
    setLoading(false);
  }, [blocked, onUnlock]);

  useEffect(() => {
    if (pin.length === 4 && !loading && !blocked) verifyPin(pin);
  }, [pin]); // eslint-disable-line

  const confirmLogout = async () => {
    setShowLogout(false);
    sessionStorage.clear();
    localStorage.removeItem(LAST_ACTIVE_KEY);
    await base44.auth.logout();
    window.location.href = '/';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center overflow-hidden font-inter bg-white"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Subtle background world map watermark */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 400'%3E%3Cellipse cx='400' cy='200' rx='380' ry='185' fill='none' stroke='%230b3d2e' stroke-width='1.5'/%3E%3Cellipse cx='400' cy='200' rx='280' ry='185' fill='none' stroke='%230b3d2e' stroke-width='1'/%3E%3Cellipse cx='400' cy='200' rx='180' ry='185' fill='none' stroke='%230b3d2e' stroke-width='1'/%3E%3Cline x1='20' y1='200' x2='780' y2='200' stroke='%230b3d2e' stroke-width='1'/%3E%3Cline x1='400' y1='15' x2='400' y2='385' stroke='%230b3d2e' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />

      {/* City skyline silhouettes */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 120'%3E%3Crect x='20' y='60' width='15' height='60' fill='%230b3d2e'/%3E%3Crect x='40' y='40' width='20' height='80' fill='%230b3d2e'/%3E%3Crect x='65' y='20' width='12' height='100' fill='%230b3d2e'/%3E%3Crect x='82' y='50' width='18' height='70' fill='%230b3d2e'/%3E%3Crect x='105' y='35' width='25' height='85' fill='%230b3d2e'/%3E%3Crect x='310' y='55' width='18' height='65' fill='%230b3d2e'/%3E%3Crect x='333' y='30' width='14' height='90' fill='%230b3d2e'/%3E%3Crect x='352' y='45' width='22' height='75' fill='%230b3d2e'/%3E%3Crect x='379' y='60' width='16' height='60' fill='%230b3d2e'/%3E%3C/svg%3E")`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        }} />

      <div className="relative z-10 w-full max-w-[430px] flex flex-col h-full">

        {/* ── TOP SECTION: Logo + Greeting ── */}
        <div className="flex flex-col items-center pt-10 px-6">

          {/* Logo Image — professional circle */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 14 }}
            className="mb-2 relative"
          >
            {/* Soft glowing ring */}
            <div className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(11,61,46,0.12) 0%, transparent 70%)',
                transform: 'scale(1.15)',
              }} />
            <div className="w-36 h-36 rounded-full overflow-hidden flex items-center justify-center relative"
              style={{
                background: '#fff',
                border: '3px solid rgba(11,61,46,0.10)',
                boxShadow: '0 8px 32px rgba(11,61,46,0.15), 0 2px 8px rgba(0,0,0,0.06)',
              }}>
              <img
                src="https://media.base44.com/images/public/69fdabac102db66d741fa29f/3bc9a9e9f_file_0000000052a071fabb0e565ce9549ea9.png"
                alt="Money Tracker"
                className="w-[90%] h-[90%] object-contain"
              />
            </div>
          </motion.div>

          {/* Brand Name */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-center mb-1"
          >
            <div className="flex items-center justify-center gap-1">
              <span className="font-black text-[28px] leading-tight" style={{ color: '#0b3d2e' }}>Money</span>
              <span className="font-black text-[28px] leading-tight" style={{ color: '#dc2626' }}>Tracker</span>
            </div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="h-px w-8" style={{ background: '#0b3d2e' }} />
              <span className="text-[10px] font-black tracking-[0.18em] uppercase" style={{ color: '#0b3d2e' }}>
                Secure Digital Banking
              </span>
              <div className="h-px w-8" style={{ background: '#0b3d2e' }} />
            </div>
          </motion.div>

          {/* User avatar icon — rounded square like screenshot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-3 mb-1"
          >
            <div
              className="w-16 h-16 rounded-[18px] flex items-center justify-center overflow-hidden shadow-lg"
              style={{
                background: user?.profile_picture
                  ? 'transparent'
                  : 'linear-gradient(135deg,#0b3d2e 0%,#1a6b4e 100%)',
                border: '2.5px solid rgba(11,61,46,0.12)',
                boxShadow: '0 4px 16px rgba(11,61,46,0.18)',
              }}
            >
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-white font-black text-2xl leading-none">{initial}</span>
                  <span className="text-[8px] text-white/60 font-bold tracking-wider uppercase">User</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-center mb-1"
          >
            <p className="font-black text-lg" style={{ color: '#0b3d2e' }}>স্বাগতম, {firstName}!</p>
            <p className="text-sm font-medium" style={{ color: '#64748b' }}>নিরাপদ প্রবেশের জন্য PIN দিন</p>
          </motion.div>

          {/* PIN Dots */}
          <PinDots value={pin} shake={shake} />

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="px-4 py-2 rounded-xl mb-1 text-center"
                style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
              >
                <p className="text-xs font-bold text-red-600">{error}</p>
                {attemptsLeft !== null && !blocked && (
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full transition-all"
                        style={{ background: i < attemptsLeft ? '#ef4444' : '#fca5a5' }} />
                    ))}
                    <span className="text-[9px] font-bold ml-1 text-red-500">{attemptsLeft} left</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Block countdown */}
          {blocked && blockTimer > 0 && (
            <div className="px-4 py-2 rounded-xl mb-1 text-center"
              style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <p className="text-xs font-bold text-red-600">
                🔒 {String(Math.floor(blockTimer / 60)).padStart(2,'0')}:{String(blockTimer % 60).padStart(2,'0')} পরে আবার চেষ্টা করুন
              </p>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3.5 h-3.5 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              <span className="text-xs text-slate-400 font-medium">যাচাই হচ্ছে...</span>
            </div>
          )}
        </div>

        {/* ── NUMBER PAD ── */}
        <div className="flex-1 flex flex-col justify-center pb-4 gap-3 relative">
          <NumPad
            loading={loading || blocked}
            onPress={d => !loading && !blocked && pin.length < 4 && setPin(p => p + d)}
            onDelete={() => !loading && setPin(p => p.slice(0, -1))}
          />
          {/* Subtle shadow after numpad */}
          <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 100%)',
            }} />

          {/* Show PIN toggle */}
          <div className="flex justify-center mt-1">
            <button
              onClick={() => setShowPin(s => !s)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ color: '#0b3d2e', background: 'rgba(11,61,46,0.07)' }}
            >
              {showPin ? <EyeOff size={13} /> : <Eye size={13} />}
              {showPin ? 'PIN লুকান' : 'PIN দেখান'}
            </button>
          </div>

          {/* Show PIN text input */}
          {showPin && (
            <div className="px-6">
              <input
                type="text"
                value={pin}
                onChange={e => { const v = e.target.value.replace(/\D/g,'').slice(0,4); setPin(v); }}
                maxLength={4}
                autoFocus
                placeholder="PIN টাইপ করুন"
                className="w-full rounded-2xl px-4 py-3 text-center font-mono font-bold text-xl tracking-[0.35em] outline-none border-2 bg-white transition-colors"
                style={{ borderColor: '#0b3d2e', color: '#0b3d2e' }}
              />
            </div>
          )}

          {/* Forgot PIN */}
          <div className="flex justify-center">
            <button onClick={() => setShowLogout(true)}
              className="text-xs font-medium py-1.5 px-3 rounded-xl transition-all"
              style={{ color: '#94a3b8' }}>
              PIN ভুলে গেছেন? → Logout
            </button>
          </div>
        </div>
      </div>

      {/* ── LOGOUT MODAL ── */}
      <AnimatePresence>
        {showLogout && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setShowLogout(false)}
          >
            <motion.div
              initial={{ y: 300, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }} transition={{ type: 'spring', damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="bg-white w-full max-w-[430px] rounded-t-3xl overflow-hidden"
              style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.15)' }}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
                  style={{ background: '#fef2f2', border: '2px solid #fecaca' }}>
                  <LogOut size={24} className="text-red-500" />
                </div>
                <div className="text-center">
                  <p className="font-black text-lg text-gray-900 mb-1">PIN ভুলে গেছেন?</p>
                  <p className="text-gray-500 text-sm">Logout করে পুনরায় Login করুন।</p>
                </div>
                <div className="space-y-2.5 pt-1">
                  <button onClick={confirmLogout}
                    className="w-full py-3.5 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
                    <LogOut size={16} /> Logout করুন
                  </button>
                  <button onClick={() => setShowLogout(false)}
                    className="w-full py-3 rounded-2xl font-semibold text-gray-600 text-sm border border-gray-200 active:scale-95 transition-transform">
                    বাতিল করুন
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});