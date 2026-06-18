import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { markSessionUnlocked, recordActivity } from '@/components/cellfin/AppLockScreen';
import { Send, ShieldCheck, Globe2, Zap, Star, ArrowRight, Eye, EyeOff } from 'lucide-react';

// Local storage key for recent login tracking
const RECENT_LOGIN_KEY = 'money_tracker_recent_login';
const LOGIN_TIMEOUT = 2 * 60 * 1000; // 2 minutes in milliseconds

export default function Welcome() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('welcome'); // 'welcome' | 'email_password' | 'pin_only'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    base44.auth.isAuthenticated().then(auth => {
      if (auth) navigate('/', { replace: true });
    });

    // Check if there's a recent login attempt
    const recentLogin = localStorage.getItem(RECENT_LOGIN_KEY);
    if (recentLogin) {
      try {
        const { email: savedEmail, timestamp } = JSON.parse(recentLogin);
        const elapsed = Date.now() - timestamp;
        
        // If within 2 minutes, show PIN-only mode
        if (elapsed < LOGIN_TIMEOUT) {
          setEmail(savedEmail);
          setMode('pin_only');
        } else {
          // Expired, clear it
          localStorage.removeItem(RECENT_LOGIN_KEY);
        }
      } catch {
        localStorage.removeItem(RECENT_LOGIN_KEY);
      }
    }

    // Auto-fill email from registration redirect
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Handle email/password login
  const handleEmailPasswordLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Save login attempt to localStorage
    localStorage.setItem(RECENT_LOGIN_KEY, JSON.stringify({
      email,
      timestamp: Date.now(),
    }));

    // Redirect to base44 login flow
    base44.auth.redirectToLogin(window.location.origin + '/');
  };

  // Handle PIN-only login
  const handlePinLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (pin.length !== 6) {
      setError('PIN must be 6 digits');
      return;
    }

    setLoading(true);

    try {
      // Verify PIN
      const res = await base44.functions.invoke('verifyPin', { pin });
      
      if (!res.data?.success) {
        setError(res.data?.error || 'Invalid PIN');
        setPin('');
        setLoading(false);
        return;
      }

      // PIN verified - mark session as unlocked and redirect
      markSessionUnlocked();
      recordActivity();
      localStorage.removeItem(RECENT_LOGIN_KEY);
      navigate('/', { replace: true });
    } catch (err) {
      setError('Failed to verify PIN. Try again.');
      setPin('');
      setLoading(false);
    }
  };

  const handleSwitchAccount = () => {
    localStorage.removeItem(RECENT_LOGIN_KEY);
    setMode('email_password');
    setEmail('');
    setPassword('');
    setPin('');
    setError('');
  };

  // ─────────────────────────────────────────────
  // Welcome Screen
  // ─────────────────────────────────────────────
  if (mode === 'welcome') {
    return (
      <div
        className="max-w-[430px] mx-auto font-inter flex flex-col"
        style={{ minHeight: '100dvh', background: 'linear-gradient(180deg,#0f172a 0%,#1a2942 100%)' }}
      >
        {/* ── HERO SECTION ── */}
        <div className="relative flex-shrink-0 overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div className="relative z-10 px-6 pt-12 pb-6 flex flex-col items-center text-center">
            {/* App icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="relative mb-4"
            >
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
                }}>
                <span className="text-white font-black text-4xl">৳</span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-black text-3xl mb-1"
              style={{ color: '#fff' }}
            >
              Money Tracker
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xs font-bold mb-6"
              style={{ color: '#10b981' }}
            >
              প্রবাসে আয়, দেশে পাঠান
            </motion.p>

            {/* Feature chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-1.5 justify-center"
            >
              {[
                { icon: Zap,        label: 'দ্রুত', color: '#10b981' },
                { icon: ShieldCheck, label: 'নিরাপদ', color: '#10b981' },
                { icon: Globe2,     label: 'বৈশ্বিক',   color: '#10b981' },
              ].map((f) => (
                <div key={f.label}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                  <f.icon size={11} />
                  {f.label}
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* ── BOTTOM CARD ── */}
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
          className="flex-1 flex flex-col px-5 pt-6"
          style={{
            background: 'linear-gradient(180deg, #0f2a22 0%, #0a1f1a 100%)',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
          }}
        >
          {/* Title */}
          <h2 className="font-black text-2xl text-white mb-1">
            আজই শুরু করুন
          </h2>
          <p className="text-xs font-medium mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
            দ্রুত, নিরাপদ ও সহজ
          </p>

          {/* Buttons */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setMode('email_password')}
            className="w-full py-3.5 rounded-2xl font-black text-base mb-2.5 transition-all"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 8px 24px rgba(16,185,129,0.3)',
              color: '#fff',
            }}
          >
            লগইন করুন
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => base44.auth.redirectToLogin(window.location.origin + '/')}
            className="w-full py-3.5 rounded-2xl font-black text-base mb-4 transition-all"
            style={{
              background: 'transparent',
              border: '1.5px solid rgba(16,185,129,0.3)',
              color: '#10b981',
            }}
          >
            নতুন অ্যাকাউন্ট
          </motion.button>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-2 text-[8px] font-bold" style={{ color: 'rgba(255,255,255,0.25)' }}>
            <span>🔐 এনক্রিপ্টেড</span>
            <span>·</span>
            <span>✅ নিরাপদ</span>
            <span>·</span>
            <span>🛡️ 2FA</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Email/Password Login Screen
  // ─────────────────────────────────────────────
  if (mode === 'email_password') {
    return (
      <div
        className="max-w-[430px] mx-auto font-inter min-h-screen flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #0f1525 100%)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Back button */}
          <button
            onClick={() => setMode('welcome')}
            className="mb-6 flex items-center gap-2 text-sm font-bold"
            style={{ color: '#10b981' }}
          >
            ← পিছনে যান
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              className="w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 20px 40px rgba(16,185,129,0.4)',
              }}
            >
              <span className="text-white font-black text-4xl">৳</span>
            </motion.div>
            <h1 className="text-white font-black text-2xl mb-1">Money Tracker</h1>
            <p className="text-slate-400 text-sm">আপনার অ্যাকাউন্টে লগইন করুন</p>
          </div>

          {/* Login Card */}
          <div
            className="rounded-3xl p-8 mb-6"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 px-4 py-3 rounded-xl text-sm font-bold text-red-300"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  Gmail / Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="আপনার Gmail দিন"
                  autoFocus
                  required
                  className="w-full px-4 py-3.5 rounded-2xl text-white placeholder:text-slate-600 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(16,185,129,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                  পাসওয়ার্ড
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="আপনার পাসওয়ার্ড"
                    required
                    className="w-full px-4 py-3.5 rounded-2xl text-white placeholder:text-slate-600 outline-none transition-all pr-12"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(16,185,129,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full mt-6 py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-3 disabled:opacity-50 transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 8px 24px rgba(16,185,129,0.4)',
                }}
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    অপেক্ষা করুন...
                  </>
                ) : (
                  <>
                    লগইন করুন
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            নতুন অ্যাকাউন্ট তৈরি করতে{' '}
            <button
              onClick={() => base44.auth.redirectToLogin(window.location.origin + '/')}
              className="font-bold"
              style={{ color: '#10b981' }}
            >
              এখানে ক্লিক করুন
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // PIN-Only Login Screen
  // ─────────────────────────────────────────────
  return (
    <div
      className="max-w-[430px] mx-auto font-inter min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #0f1525 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm text-center"
      >
        {/* Header Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', bounce: 0.4 }}
          className="w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-6"
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: '0 20px 40px rgba(16,185,129,0.4)',
          }}
        >
          <span className="text-white font-black text-3xl">O</span>
        </motion.div>

        {/* Welcome Message */}
        <h1 className="text-white font-black text-3xl mb-2">Welcome back!</h1>
        <p className="text-emerald-400 font-bold mb-1">Ok Tap</p>
        <p className="text-slate-400 text-sm mb-8">Enter your PIN to continue</p>

        {/* Login Card */}
        <div
          className="rounded-3xl p-8 mb-8"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 px-4 py-3 rounded-xl text-sm font-bold text-red-300"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              {error}
            </motion.div>
          )}

          {/* Email Display */}
          <div className="mb-6 p-3 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p className="text-xs text-slate-400 mb-1">Logged in as</p>
            <p className="text-white font-bold text-sm truncate">{email}</p>
          </div>

          {/* PIN Input */}
          <form onSubmit={handlePinLogin} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">
                Enter 6-Digit PIN
              </label>
              <input
                type="password"
                value={pin}
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPin(digits);
                  setError('');
                }}
                placeholder="● ● ● ● ● ●"
                autoFocus
                maxLength="6"
                className="w-full text-center text-3xl tracking-[0.5em] font-bold text-white placeholder:text-slate-600 outline-none transition-all py-4 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: error ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={e => {
                  if (!error) e.target.style.borderColor = 'rgba(16,185,129,0.6)';
                }}
                onBlur={e => {
                  if (!error) e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              />
            </div>

            {/* PIN Indicator Dots */}
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <motion.div
                  key={i}
                  animate={{ scale: i < pin.length ? 1.2 : 1 }}
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: i < pin.length ? '#10b981' : 'rgba(255,255,255,0.15)',
                  }}
                />
              ))}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || pin.length !== 6}
              className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-3 disabled:opacity-50 transition-all active:scale-95 mt-8"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 8px 24px rgba(16,185,129,0.4)',
              }}
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  অপেক্ষা করুন...
                </>
              ) : (
                <>
                  লগইন করুন
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Logout / use different account */}
        <button
          onClick={() => {
            localStorage.removeItem(RECENT_LOGIN_KEY);
            sessionStorage.clear();
            base44.auth.logout();
            window.location.href = '/welcome';
          }}
          className="flex items-center justify-center gap-2 text-xs font-semibold py-2"
          style={{ color: 'rgba(255,255,255,0.2)' }}
        >
          অন্য অ্যাকাউন্টে লগইন করুন
        </button>
      </motion.div>
    </div>
  );
}