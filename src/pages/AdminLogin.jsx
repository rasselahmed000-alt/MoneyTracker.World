import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, Mail, KeyRound, Hash, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ADMIN_SESSION_KEY = 'admin_auth_session';
const setAdminSession = (data) => localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ ...data, ts: Date.now() }));
const getAdminSession = () => {
  const stored = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!stored) return null;
  try {
    const { ts } = JSON.parse(stored);
    if (Date.now() - ts > 24 * 60 * 60 * 1000) { localStorage.removeItem(ADMIN_SESSION_KEY); return null; }
    return JSON.parse(stored);
  } catch { return null; }
};

export default function AdminLogin() {
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState(1); // 1=email, 2=pin, 3=otp
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = getAdminSession();
    if (session?.email) window.location.href = '/admin/dashboard';
    else setChecking(false);
  }, []);

  const handleStep1 = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('adminAuthVerify', { step: 'email', email: email.trim().toLowerCase() });
      if (res.data?.success) {
        setStep(2);
      } else {
        setError(res.data?.error || 'Unauthorized email address.');
      }
    } catch {
      setError('Verification failed. Try again.');
    }
    setLoading(false);
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    if (pin.length < 8) return;
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('adminAuthVerify', { step: 'pin', email: email.trim().toLowerCase(), pin });
      if (res.data?.success) {
        setStep(3);
      } else {
        setError(res.data?.error || 'Incorrect PIN.');
        setPin('');
      }
    } catch {
      setError('Verification failed. Try again.');
    }
    setLoading(false);
  };

  const handleStep3 = async (e) => {
    e.preventDefault();
    if (otp.length < 4) return;
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('adminAuthVerify', { step: 'otp', email: email.trim().toLowerCase(), pin, otp });
      if (res.data?.success) {
        setAdminSession({ email: email.trim().toLowerCase(), verified: true });
        window.location.href = '/admin/dashboard';
      } else {
        setError(res.data?.error || 'Incorrect OTP.');
        setOtp('');
      }
    } catch {
      setError('Verification failed. Try again.');
    }
    setLoading(false);
  };

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)' }}>
        <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const STEP_CONFIG = [
    { n: 1, icon: Mail,     label: 'Gmail Address', desc: 'Authorized admin email' },
    { n: 2, icon: KeyRound, label: 'Security PIN',  desc: '8-digit admin PIN' },
    { n: 3, icon: Hash,     label: 'OTP Code',      desc: '4-digit one-time password' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%)' }}>
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: 'radial-gradient(circle,#10b981,transparent)' }} />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: 'radial-gradient(circle,#6366f1,transparent)' }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 20px 40px rgba(16,185,129,0.4)' }}>
            <Shield size={36} className="text-white" />
          </div>
          <h1 className="text-white font-black text-3xl tracking-tight">Money Tracker</h1>
          <p className="font-bold text-sm mt-1" style={{ color: '#10b981' }}>Admin Console</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEP_CONFIG.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all"
                style={{
                  background: step > s.n ? '#10b981' : step === s.n ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                  border: step === s.n ? '2px solid #10b981' : step > s.n ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  color: step >= s.n ? (step > s.n ? '#fff' : '#10b981') : 'rgba(255,255,255,0.25)',
                }}>
                {step > s.n ? <CheckCircle2 size={14} /> : s.n}
              </div>
              {i < STEP_CONFIG.length - 1 && (
                <div className="w-8 h-0.5 rounded-full transition-all"
                  style={{ background: step > s.n ? '#10b981' : 'rgba(255,255,255,0.1)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}>

          <AnimatePresence mode="wait">
            {/* Step 1 — Email */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-white font-black text-xl mb-1">Admin Gmail</h2>
                <p className="text-slate-400 text-sm mb-6">অনুমোদিত Gmail ঠিকানা লিখুন</p>
                {error && <ErrorMsg msg={error} />}
                <form onSubmit={handleStep1} className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Gmail Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                        placeholder="admin@gmail.com" autoFocus
                        className="w-full pl-11 pr-4 py-4 rounded-2xl text-white placeholder:text-slate-600 outline-none transition-all text-sm"
                        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(16,185,129,0.6)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                    </div>
                  </div>
                  <StepButton loading={loading} disabled={!email.trim()} label="Continue" />
                </form>
              </motion.div>
            )}

            {/* Step 2 — PIN */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-white font-black text-xl mb-1">Security PIN</h2>
                <p className="text-slate-400 text-sm mb-6">8-digit admin security PIN লিখুন</p>
                {error && <ErrorMsg msg={error} />}
                <form onSubmit={handleStep2} className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">PIN Code</label>
                    <div className="relative">
                      <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password" value={pin}
                        onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 8)); setError(''); }}
                        placeholder="● ● ● ● ● ● ● ●" autoFocus
                        className="w-full pl-11 pr-4 py-4 rounded-2xl text-white placeholder:text-slate-600 outline-none transition-all tracking-[0.5em] font-bold text-lg text-center"
                        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(16,185,129,0.6)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                    </div>
                  </div>
                  <StepButton loading={loading} disabled={pin.length < 8} label="Verify PIN" />
                  <BackBtn onClick={() => { setStep(1); setPin(''); setError(''); }} />
                </form>
              </motion.div>
            )}

            {/* Step 3 — OTP */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-white font-black text-xl mb-1">OTP Verification</h2>
                <p className="text-slate-400 text-sm mb-6">4-digit OTP code লিখুন</p>
                {error && <ErrorMsg msg={error} />}
                <form onSubmit={handleStep3} className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">OTP Code</label>
                    <div className="relative">
                      <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password" value={otp}
                        onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
                        placeholder="● ● ● ●" autoFocus
                        className="w-full pl-11 pr-4 py-4 rounded-2xl text-white placeholder:text-slate-600 outline-none transition-all tracking-[0.8em] font-bold text-2xl text-center"
                        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(16,185,129,0.6)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                    </div>
                  </div>
                  <StepButton loading={loading} disabled={otp.length < 4} label="Access Admin Panel" />
                  <BackBtn onClick={() => { setStep(2); setOtp(''); setError(''); }} />
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-slate-600 text-xs text-center mt-6">🔒 শুধুমাত্র অনুমোদিত অ্যাডমিন প্রবেশ করতে পারবেন</p>
        </div>
      </motion.div>
    </div>
  );
}

function ErrorMsg({ msg }) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="mb-5 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold text-red-300"
      style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
      <AlertCircle size={15} className="shrink-0" />
      {msg}
    </motion.div>
  );
}

function StepButton({ loading, disabled, label }) {
  return (
    <button type="submit" disabled={loading || disabled}
      className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-3 disabled:opacity-40 transition-all active:scale-95"
      style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 8px 24px rgba(16,185,129,0.35)' }}>
      {loading
        ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        : <><span>{label}</span><ArrowRight size={18} /></>
      }
    </button>
  );
}

function BackBtn({ onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full py-2 text-slate-500 text-sm font-medium hover:text-slate-300 transition-colors">
      ← Back
    </button>
  );
}