import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Phone, Camera, ChevronRight, LogOut, Star, X, Check, Eye, EyeOff, Trash2, MessageCircle, ExternalLink, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import AppShell from '../components/cellfin/AppShell';
import UniversalHeader from '@/components/cellfin/UniversalHeader';

const KYC_BADGE = {
  pending: { color: 'bg-slate-100 text-slate-500 border-slate-200', label: 'Verification Required' },
  submitted: { color: 'bg-blue-50 text-blue-600 border-blue-200', label: 'Under Review' },
  approved: { color: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: '✓ Verified' },
  rejected: { color: 'bg-red-50 text-red-600 border-red-200', label: 'KYC Rejected' },
};

// ── Modal wrapper ──
function Modal({ title, onClose, children }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-end justify-center z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: 400 }} animate={{ y: 0 }} exit={{ y: 400 }}
        transition={{ type: 'spring', damping: 28 }}
        className="bg-white w-full max-w-[430px] rounded-t-3xl flex flex-col"
        style={{ maxHeight: '90vh' }}>
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-gray-100">
          <h3 className="font-extrabold text-lg text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
            <X size={18} />
          </button>
        </div>
        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-5 pb-28 flex-1">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Edit Profile Modal ──
function EditProfileModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    full_name: user?.display_name || user?.full_name || '',
    country: user?.country || '',
    address: user?.address || '',
    occupation: user?.occupation || '',
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.full_name.trim()) { setError('নাম দিন'); return; }
    setError('');
    setSaving(true);
    try {
      // Save as display_name so it overrides the Google/platform full_name everywhere
      await base44.auth.updateMe({
        display_name: form.full_name.trim(),
        country: form.country.trim(),
        address: form.address.trim(),
        occupation: form.occupation.trim(),
      });
      // Broadcast so Home and other pages refresh user instantly
      window.dispatchEvent(new CustomEvent('user_profile_updated'));
      setDone(true);
      setTimeout(() => { onSave(); onClose(); }, 900);
    } catch {
      setError('Save করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
    setSaving(false);
  };

  const inputClass = "w-full border-2 border-gray-200 focus:border-forest rounded-xl px-4 py-3 font-semibold text-sm outline-none transition-colors";

  return (
    <Modal title="Edit Profile" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Full Name <span className="text-red-400">*</span></p>
          <input value={form.full_name} onChange={set('full_name')} className={inputClass} placeholder="আপনার পূর্ণ নাম" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Country</p>
          <input value={form.country} onChange={set('country')} className={inputClass} placeholder="e.g. Bangladesh" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Address</p>
          <input value={form.address} onChange={set('address')} className={inputClass} placeholder="আপনার ঠিকানা" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Occupation</p>
          <input value={form.occupation} onChange={set('occupation')} className={inputClass} placeholder="e.g. Engineer, Teacher..." />
        </div>
        {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-xl">{error}</p>}
        <button onClick={handleSave} disabled={saving || done}
          className="w-full bg-forest text-white py-3.5 rounded-2xl font-extrabold disabled:opacity-60 flex items-center justify-center gap-2">
          {done ? <><Check size={18} /> সংরক্ষিত হয়েছে!</> : saving ? 'সংরক্ষণ করা হচ্ছে...' : 'Save Changes'}
        </button>
      </div>
    </Modal>
  );
}

// ── Set PIN Modal (first time) ──
function SetPinModal({ onClose, onSaved }) {
  const [newPin, setNewPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    if (newPin.length !== 4) { setError('PIN ঠিক ৪ ডিজিট হতে হবে'); return; }
    if (newPin !== confirm) { setError('PIN দুটি মিলছে না'); return; }
    setSaving(true);
    await base44.auth.updateMe({ pin: newPin });
    setSaving(false);
    setDone(true);
    setTimeout(() => { onSaved(); onClose(); }, 1200);
  };

  return (
    <Modal title="Set PIN" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
          <p className="text-2xl mb-1">🔐</p>
          <p className="font-bold text-blue-700 text-sm">প্রথমবার PIN সেট করুন</p>
          <p className="text-blue-500 text-xs mt-1">এই PIN দিয়ে আপনার সকল লেনদেন নিরাপদ থাকবে</p>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">New PIN (ঠিক ৪ ডিজিট)</p>
          <div className="relative">
            <input type={showNew ? 'text' : 'password'} value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full border-2 border-gray-200 focus:border-forest rounded-xl px-4 py-3 font-bold text-xl tracking-widest outline-none pr-12 transition-colors text-center"
              placeholder="● ● ● ●" autoFocus />
            <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-3.5 text-gray-400">
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Confirm PIN</p>
          <input type="password" value={confirm}
            onChange={e => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="w-full border-2 border-gray-200 focus:border-forest rounded-xl px-4 py-3 font-bold text-xl tracking-widest outline-none transition-colors text-center"
            placeholder="● ● ● ●" />
        </div>
        {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
        <button onClick={handleSave} disabled={saving || done}
          className="w-full bg-forest text-white py-3.5 rounded-2xl font-extrabold disabled:opacity-60 flex items-center justify-center gap-2">
          {done ? <><Check size={18} /> PIN Set Successfully!</> : saving ? 'Saving...' : 'Set PIN →'}
        </button>
      </div>
    </Modal>
  );
}

// ── Change PIN Modal (existing PIN) ──
function ChangePinModal({ onClose }) {
  // Step 1: verify current PIN, Step 2: set new PIN
  const [step, setStep] = useState(1);
  const [current, setCurrent] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [blockTimer, setBlockTimer] = useState(0);

  useEffect(() => {
    if (blockTimer <= 0) return;
    const t = setInterval(() => setBlockTimer(prev => {
      if (prev <= 1) { clearInterval(t); setBlocked(false); return 0; }
      return prev - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [blockTimer]);

  const handleVerifyCurrent = async () => {
    setError('');
    if (current.length !== 4) { setError('বর্তমান PIN ঠিক ৪ ডিজিট হতে হবে'); return; }
    setLoading(true);
    const res = await base44.functions.invoke('verifyPin', { pin: current });
    setLoading(false);
    if (res.data?.blocked) {
      setBlocked(true);
      setBlockTimer(res.data?.remaining_seconds || 300);
      setError(res.data?.error);
      return;
    }
    if (!res.data?.success) {
      setError(res.data?.error || 'ভুল PIN!');
      return;
    }
    setStep(2);
    setCurrent('');
    setError('');
  };

  const handleSetNew = async () => {
    setError('');
    if (newPin.length !== 4) { setError('নতুন PIN ঠিক ৪ ডিজিট হতে হবে'); return; }
    if (newPin !== confirm) { setError('নতুন PIN দুটি মিলছে না'); return; }
    setLoading(true);
    await base44.auth.updateMe({ pin: newPin });
    setLoading(false);
    setDone(true);
    setTimeout(onClose, 1400);
  };

  return (
    <Modal title="Change PIN" onClose={onClose}>
      <div className="space-y-4">
        {/* Step indicator */}
        <div className="flex items-center gap-2 justify-center mb-2">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold transition-all ${step >= s ? 'bg-forest text-white' : 'bg-gray-100 text-gray-400'}`}>
                {step > s ? <Check size={14} /> : s}
              </div>
              {s < 2 && <div className={`w-8 h-0.5 rounded-full transition-all ${step > s ? 'bg-forest' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <>
            <p className="text-center text-sm text-gray-500 font-medium">বর্তমান PIN দিয়ে যাচাই করুন</p>
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Current PIN</p>
              <div className="relative">
                <input type={showCurrent ? 'text' : 'password'} value={current}
                  onChange={e => { setCurrent(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
                  className={`w-full border-2 rounded-xl px-4 py-3 font-bold text-xl tracking-widest outline-none pr-12 transition-colors text-center ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-forest'}`}
                  placeholder="● ● ● ●" autoFocus disabled={blocked} />
                <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-3.5 text-gray-400">
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {blocked && blockTimer > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
                <p className="text-red-600 font-bold text-sm">🔒 সাময়িকভাবে ব্লক</p>
                <p className="text-red-500 text-xs mt-1 font-mono">
                  {String(Math.floor(blockTimer / 60)).padStart(2, '0')}:{String(blockTimer % 60).padStart(2, '0')} পরে আবার চেষ্টা করুন
                </p>
              </div>
            )}
            {error && !blocked && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
            <button onClick={handleVerifyCurrent} disabled={loading || blocked || current.length !== 4}
              className="w-full bg-forest text-white py-3.5 rounded-2xl font-extrabold disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? 'Verifying...' : 'Verify →'}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
              <p className="text-emerald-700 font-bold text-sm">✅ PIN যাচাই সম্পন্ন</p>
              <p className="text-emerald-600 text-xs mt-0.5">এখন নতুন PIN সেট করুন</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">New PIN (ঠিক ৪ ডিজিট)</p>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full border-2 border-gray-200 focus:border-forest rounded-xl px-4 py-3 font-bold text-xl tracking-widest outline-none pr-12 transition-colors text-center"
                  placeholder="● ● ● ●" autoFocus />
                <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-3.5 text-gray-400">
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Confirm New PIN</p>
              <input type="password" value={confirm}
                onChange={e => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full border-2 border-gray-200 focus:border-forest rounded-xl px-4 py-3 font-bold text-xl tracking-widest outline-none transition-colors text-center"
                placeholder="● ● ● ●" />
            </div>
            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
            <button onClick={handleSetNew} disabled={loading || done}
              className="w-full bg-forest text-white py-3.5 rounded-2xl font-extrabold disabled:opacity-60 flex items-center justify-center gap-2">
              {done ? <><Check size={18} /> PIN Changed!</> : loading ? 'Saving...' : 'Update PIN →'}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

// ── Link Mobile Modal (with OTP system) ──
const COUNTRY_CODES = [
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+39', flag: '🇮🇹', name: 'Italy' },
];

function LinkMobileModal({ user, onClose, onSave }) {
  const [countryCode, setCountryCode] = useState('+880');
  const [showCountryDrop, setShowCountryDrop] = useState(false);
  const [mobile, setMobile] = useState(user?.mobile?.replace(/^\+\d+\s?/, '') || '');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (!otpSent) return;
    setTimer(300); // 5 minutes
    const t = setInterval(() => setTimer(prev => { if (prev <= 1) { clearInterval(t); return 0; } return prev - 1; }), 1000);
    return () => clearInterval(t);
  }, [otpSent]);

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];

  const handleSendOtp = async () => {
    setError('');
    if (mobile.length < 6) { setError('সঠিক মোবাইল নম্বর দিন'); return; }
    setSending(true);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    try {
      const me = await base44.auth.me();
      const fullNumber = `${countryCode} ${mobile}`;
      const countryName = selectedCountry.name;

      await base44.integrations.Core.SendEmail({
        to: me.email,
        subject: `🔐 Money Tracker OTP Verification Code: ${code}`,
        body: `প্রিয় ${me.full_name || 'ব্যবহারকারী'},

আপনি নিচের নম্বরটি Money Tracker অ্যাকাউন্টে লিংক করতে চাইছেন:

📱 Mobile: ${fullNumber}
🌍 Country: ${countryName}

আপনার OTP (One-Time Password):

━━━━━━━━━━━━
   ${code}
━━━━━━━━━━━━

⏳ এই কোডটি ৫ মিনিটের মধ্যে ব্যবহার করুন।
🔒 নিরাপত্তার জন্য এই কোড কাউকে শেয়ার করবেন না।

যদি আপনি এই অনুরোধ না করে থাকেন, অনুগ্রহ করে এটি উপেক্ষা করুন।

— Money Tracker Team`,
      });
    } catch (e) {
      setError('OTP পাঠাতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
      setSending(false);
      return;
    }
    setSending(false);
    setOtpSent(true);
  };

  const handleVerify = async () => {
    setError('');
    if (otp !== generatedOtp) { setError('OTP সঠিক নয়, আবার চেষ্টা করুন'); return; }
    setVerifying(true);
    await base44.auth.updateMe({ mobile: `${countryCode} ${mobile}` });
    setVerifying(false);
    setDone(true);
    setTimeout(() => { onSave(); onClose(); }, 1000);
  };

  return (
    <Modal title="Link Mobile Number" onClose={onClose}>
      <div className="space-y-4">
        {!otpSent ? (
          <>
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Country Code</p>
              <div className="relative">
                <button onClick={() => setShowCountryDrop(!showCountryDrop)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm font-semibold text-left">
                  <span className="text-xl">{selectedCountry.flag}</span>
                  <span className="flex-1">{selectedCountry.name} ({selectedCountry.code})</span>
                  <span className="text-gray-400 text-xs">▼</span>
                </button>
                <AnimatePresence>
                  {showCountryDrop && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="absolute top-full left-0 right-0 z-30 bg-white rounded-2xl shadow-xl border mt-1 max-h-48 overflow-y-auto">
                      {COUNTRY_CODES.map(c => (
                        <button key={c.code} onClick={() => { setCountryCode(c.code); setShowCountryDrop(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0">
                          <span className="text-lg">{c.flag}</span>
                          <span className="flex-1 text-left font-medium">{c.name}</span>
                          <span className="text-gray-400 text-xs">{c.code}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Mobile Number</p>
              <div className="flex items-center gap-2">
                <span className="bg-gray-100 px-3 py-3 rounded-xl font-bold text-sm text-gray-600">{countryCode}</span>
                <input type="tel" value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 15))}
                  className="flex-1 border-2 border-gray-200 focus:border-forest rounded-xl px-4 py-3 font-semibold text-sm outline-none transition-colors"
                  placeholder="Mobile number" />
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center">OTP আপনার ইমেইলে পাঠানো হবে</p>
            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
            <button onClick={handleSendOtp} disabled={sending}
              className="w-full bg-forest text-white py-3.5 rounded-2xl font-extrabold disabled:opacity-60">
              {sending ? 'Sending OTP...' : 'Send OTP →'}
            </button>
          </>
        ) : (
          <>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
              <p className="font-bold text-emerald-700 text-sm">✅ OTP পাঠানো হয়েছে!</p>
              <p className="text-emerald-700 text-xs font-bold mt-1">📱 {selectedCountry.flag} {countryCode} {mobile}</p>
              <p className="text-emerald-600 text-xs mt-1">📧 আপনার ইমেইলে OTP কোড পাঠানো হয়েছে</p>
              {timer > 0 ? (
                <p className="text-emerald-500 text-xs mt-1 font-mono">
                  ⏳ {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')} বাকি
                </p>
              ) : (
                <p className="text-red-500 text-xs mt-1 font-bold">⚠️ OTP মেয়াদ শেষ</p>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Enter OTP</p>
              <input type="tel" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full border-2 border-gray-200 focus:border-forest rounded-xl px-4 py-3 font-bold text-2xl tracking-widest text-center outline-none transition-colors"
                placeholder="● ● ● ● ● ●" autoFocus />
            </div>
            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
            <button onClick={handleVerify} disabled={verifying || done || otp.length < 6 || timer === 0}
              className="w-full bg-forest text-white py-3.5 rounded-2xl font-extrabold disabled:opacity-60 flex items-center justify-center gap-2">
              {done ? <><Check size={18} /> Verified!</> : verifying ? 'Verifying...' : 'Verify & Link'}
            </button>
            <div className="flex gap-3">
              <button onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}
                className="flex-1 text-gray-400 text-sm font-medium py-2">
                ← নম্বর পরিবর্তন
              </button>
              <button onClick={() => { setOtp(''); setError(''); setOtpSent(false); setTimeout(handleSendOtp, 100); }}
                disabled={sending || timer > 240}
                className="flex-1 text-forest text-sm font-bold py-2 disabled:opacity-40">
                {sending ? 'Sending...' : '🔄 Resend OTP'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}



// ── Delete Account Modal ──
function DeleteAccountModal({ onClose }) {
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm !== 'DELETE') return;
    setDeleting(true);
    try {
      // Mark account as deleted (soft delete)
      await base44.auth.updateMe({ account_status: 'deleted', deleted_at: new Date().toISOString() });
      // Clear all sensitive data
      await base44.auth.updateMe({ 
        balance: 0,
        pin: '',
        profile_picture: null,
        mobile: null,
      });
      // Logout and redirect
      base44.auth.logout();
      window.location.href = '/';
    } catch (e) {
      console.error('Delete failed:', e);
      setDeleting(false);
    }
  };

  return (
    <Modal title="Delete Account" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
          <p className="text-5xl mb-2">⚠️</p>
          <p className="font-extrabold text-red-700 text-sm">This action is permanent!</p>
          <p className="text-red-500 text-xs mt-1">আপনার অ্যাকাউন্ট, ব্যালেন্স এবং সকল ডেটা মুছে যাবে।</p>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 mb-1.5 text-center">নিশ্চিত করতে <span className="text-red-600 font-extrabold">DELETE</span> টাইপ করুন</p>
          <input
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="DELETE"
            className="w-full border-2 border-gray-200 focus:border-red-400 rounded-xl px-4 py-3 font-bold text-sm outline-none text-center tracking-widest transition-colors"
          />
        </div>
        <button
          onClick={handleDelete}
          disabled={confirm !== 'DELETE' || deleting}
          className="w-full bg-red-500 text-white py-3.5 rounded-2xl font-extrabold disabled:opacity-40 flex items-center justify-center gap-2">
          <Trash2 size={16} />
          {deleting ? 'Deleting...' : 'Delete My Account'}
        </button>
        <button onClick={onClose} className="w-full text-gray-400 text-sm font-medium py-2">Cancel</button>
      </div>
    </Modal>
  );
}

// ── Main Profile Page ──
export default function Profile() {
  const navigate = useNavigate();
  const { user: authUser, refreshUser } = useAuth();
  const [localUser, setLocalUser] = useState(null);
  const user = localUser || authUser;
  const [modal, setModal] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  const loadUser = async () => {
    try {
      const u = await base44.auth.me();
      if (u) { setLocalUser({ ...u }); refreshUser(); }
    } catch {}
  };
  useEffect(() => { loadUser(); }, []); // eslint-disable-line

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ profile_picture: file_url });
      await loadUser();
      window.dispatchEvent(new CustomEvent('user_profile_updated'));
    } catch (err) {
      console.warn('Photo upload failed:', err);
    }
    setUploadingPhoto(false);
  };

  const name = user?.display_name || user?.full_name || 'User';
  
  // Auto-refresh when profile updates
  useEffect(() => {
    const handleProfileUpdate = () => loadUser();
    window.addEventListener('user_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('user_profile_updated', handleProfileUpdate);
  }, []);
  const initial = name[0]?.toUpperCase();
  const kycBadge = KYC_BADGE[user?.kyc_status || 'pending'];
  const hasPin = !!(user?.pin);

  const [appSettings, setAppSettings] = useState(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load feature flags from AppSettings
  useEffect(() => {
    if (settingsLoaded) return;
    base44.entities.AppSettings.filter({ key: 'enable_mobile_linking' })
      .then(res => {
        const setting = res?.[0];
        const enabled = setting?.value === 'true';
        setAppSettings({ enable_mobile_linking: enabled });
        setSettingsLoaded(true);
      })
      .catch(() => {
        setAppSettings({ enable_mobile_linking: true }); // Default to enabled
        setSettingsLoaded(true);
      });
  }, []);

  const MENU = [
    { icon: User, label: 'Edit Profile', desc: 'নাম ও তথ্য আপডেট করুন', action: () => setModal('edit') },
    // Show "Set PIN" only if no PIN exists, "Change PIN" if PIN already set
    ...(hasPin
      ? [{ icon: Shield, label: 'Change PIN', desc: 'বর্তমান PIN পরিবর্তন করুন', action: () => setModal('changepin'), badge: '🔒' }]
      : [{ icon: Shield, label: 'Set PIN', desc: 'লেনদেন সুরক্ষার জন্য PIN সেট করুন', action: () => setModal('setpin'), badge: '⚠️' }]
    ),
    ...(appSettings?.enable_mobile_linking !== false ? [{ icon: Phone, label: 'Linked Mobile', desc: user?.mobile || 'নম্বর লিংক করুন', action: () => setModal('mobile') }] : []),
    { icon: Star, label: 'Exchange Rates', desc: 'SAR, MYR → BDT', action: () => navigate('/exchange-rates') },
    { icon: MessageCircle, label: '24/7 Support', desc: 'WhatsApp · IMO · Telegram', action: () => navigate('/support-center'), badge: '🎧' },
    { icon: Info, label: 'About Us', desc: 'আমাদের সম্পর্কে জানুন', action: () => navigate('/about') },
  ];

  return (
    <AppShell header={<UniversalHeader title="Profile" showBack={false} />}>
      {/* Custom Profile Section */}
      <div className="bg-forest px-5 pb-5 relative overflow-hidden -mx-5">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />

        <div className="flex items-center gap-4 relative z-10">
          {/* Profile picture with upload */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gold/20 border-2 border-gold overflow-hidden flex items-center justify-center">
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gold font-extrabold text-2xl">{initial}</span>
              )}
            </div>
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-gold rounded-full flex items-center justify-center shadow-md border-2 border-forest"
            >
              {uploadingPhoto
                ? <span className="w-3 h-3 border border-forest/40 border-t-forest rounded-full animate-spin" />
                : <Camera size={11} className="text-forest" />}
            </button>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>

          <div className="flex-1">
            <h2 className="text-white font-extrabold text-lg">{name}</h2>
            <p className="text-white/50 text-xs">{user?.mobile || 'Mobile not set'}</p>
            <p className="text-white/40 text-xs">{[user?.country, user?.occupation].filter(Boolean).join(' · ') || 'Profile অসম্পূর্ণ'} · {user?.currency || 'BDT'}</p>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${kycBadge.color}`}>{kycBadge.label}</span>
        </div>

        {/* KYC Rejected reason */}
        {user?.kyc_status === 'rejected' && user?.kyc_reject_reason && (
          <div className="mt-3 bg-red-500/20 border border-red-400/30 rounded-2xl p-3 relative z-10">
            <p className="font-bold text-red-200 text-xs mb-1">❌ Rejection Reason:</p>
            <p className="text-red-300/80 text-[11px]">{user.kyc_reject_reason}</p>
          </div>
        )}

        {user?.kyc_status !== 'approved' && user?.kyc_status !== 'submitted' && (
          <div className="mt-4 bg-amber-500/20 border border-amber-400/30 rounded-2xl p-3 flex items-center gap-3 relative z-10">
            <span className="text-xl">📋</span>
            <div className="flex-1">
              <p className="font-bold text-amber-200 text-xs">Complete KYC Verification</p>
              <p className="text-amber-300/70 text-[10px]">Upload NID + Face Photo to unlock full features</p>
            </div>
            <button onClick={() => navigate('/kyc')} className="bg-amber-400 text-forest px-3 py-1.5 rounded-xl text-[10px] font-extrabold shrink-0">Start</button>
          </div>
        )}
      </div>

      <div className="px-5 py-5 space-y-3">
        {MENU.map((item) => (
          <button key={item.label} onClick={item.action}
            className="w-full flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-border hover:bg-secondary/30 transition-colors">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.label === 'Set PIN' ? 'bg-amber-50 text-amber-600' : 'bg-forest/10 text-forest'}`}>
              <item.icon size={18} />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-foreground">{item.label}</p>
                {item.badge && <span className="text-xs">{item.badge}</span>}
              </div>
              <p className="text-[11px] text-muted-foreground">{item.desc}</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
        ))}

        {user && (
          <>
            <button onClick={() => { base44.auth.logout(); window.location.href = '/'; }}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-red-200 text-red-500 font-bold text-sm hover:bg-red-50 transition-colors mt-4">
              <LogOut size={18} />
              <span>Log Out</span>
            </button>

            <button onClick={() => setModal('delete')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-red-400 text-xs font-semibold hover:bg-red-50 transition-colors">
              <Trash2 size={14} />
              <span>Delete Account</span>
            </button>
          </>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal === 'edit' && <EditProfileModal user={user} onClose={() => setModal(null)} onSave={loadUser} />}
        {modal === 'setpin' && <SetPinModal onClose={() => setModal(null)} onSaved={loadUser} />}
        {modal === 'changepin' && <ChangePinModal onClose={() => setModal(null)} />}
        {modal === 'mobile' && <LinkMobileModal user={user} onClose={() => setModal(null)} onSave={loadUser} />}
        {modal === 'delete' && <DeleteAccountModal onClose={() => setModal(null)} />}
      </AnimatePresence>
    </AppShell>
  );
}