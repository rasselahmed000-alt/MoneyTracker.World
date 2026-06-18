import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import TxNotificationToast from '../components/cellfin/TxNotificationToast';
const PROVIDERS = {
  bkash: {
    id: 'bkash',
    name: 'bKash',
    logo: 'https://media.base44.com/images/public/69fdabac102db66d741fa29f/87535a6b9_1780440626277.png',
    gradient: 'from-pink-600 to-pink-500',
    bg: 'bg-pink-600',
    light: 'bg-pink-50',
    border: 'border-pink-200',
    text: 'text-pink-600',
    btn: 'bg-pink-600 hover:bg-pink-700',
    focus: 'focus:border-pink-500',
    tagline: 'Sending money has never been easier',
  },
  nagad: {
    id: 'nagad',
    name: 'Nagad',
    logo: 'https://media.base44.com/images/public/69fdabac102db66d741fa29f/30d2abd72_1780440344814.png',
    gradient: 'from-orange-500 to-orange-400',
    bg: 'bg-orange-500',
    light: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-600',
    btn: 'bg-orange-500 hover:bg-orange-600',
    focus: 'focus:border-orange-500',
    tagline: 'Fast & Secure Digital Payments',
  },
  rocket: {
    id: 'rocket',
    name: 'Rocket',
    logo: 'https://media.base44.com/images/public/69fdabac102db66d741fa29f/6344c9b81_IMG_20260603_045402_210.png',
    gradient: 'from-purple-700 to-purple-500',
    bg: 'bg-purple-700',
    light: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    btn: 'bg-purple-700 hover:bg-purple-800',
    focus: 'focus:border-purple-500',
    tagline: 'Your Trusted Mobile Banking Service',
  },
};

const TYPES = [
  { id: 'Personal', label: 'Personal', icon: '👤' },
  { id: 'Agent', label: 'Agent', icon: '🏪' },
  { id: 'Merchant', label: 'Merchant', icon: '🏬' },
];

export default function MobileBanking() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const providerKey = params.get('provider') || 'bkash';
  const p = PROVIDERS[providerKey] || PROVIDERS.bkash;

  const [mobile, setMobile] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('Personal');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txId, setTxId] = useState('');
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinBlocked, setPinBlocked] = useState(false);
  const [pinAttemptsLeft, setPinAttemptsLeft] = useState(null);
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [userBalance, setUserBalance] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUserBalance(u?.balance ?? 0)).catch(() => {});
  }, []);

  const handleSend = async () => {
    if (mobile.length < 11) { setError('সঠিক মোবাইল নম্বর দিন (১১ ডিজিট)'); return; }
    if (!amount || Number(amount) < 10) { setError('সর্বনিম্ন ৳১০ পাঠাতে হবে'); return; }
    setError('');
    setShowPin(true);
  };

  const handleConfirm = async () => {
    if (pin.length !== 4) return;
    setLoading(true);
    setPinError('');
    setInsufficientBalance(false);
    try {
      // Verify PIN via backend
       const pinRes = await base44.functions.invoke('verifyPin', { pin });
       if (!pinRes.data?.success) {
         if (pinRes.data?.no_pin) {
           setError('PIN সেট করা নেই। Profile → Shield থেকে PIN সেট করুন।');
           setShowPin(false);
           setLoading(false);
           return;
         }
         setPinError(pinRes.data?.error || 'ভুল PIN!');
         setPinBlocked(!!pinRes.data?.blocked);
         if (pinRes.data?.attempts_remaining !== undefined) setPinAttemptsLeft(pinRes.data.attempts_remaining);
         setLoading(false);
         return;
       }
      setPinAttemptsLeft(null);

      const me = await base44.auth.me();
      const bal = me?.balance ?? 0;
      const minBal = me?.min_balance ?? 0;
      if (bal < Number(amount)) {
        setInsufficientBalance(true);
        setLoading(false);
        setShowPin(false);
        return;
      }
      if (minBal > 0 && (bal - Number(amount)) < minBal) {
        setError(`এই লেনদেন সম্পন্ন করা যাবে না। আপনার অ্যাকাউন্টে সর্বদা কমপক্ষে ৳${minBal.toLocaleString()} ব্যালেন্স রাখতে হবে।`);
        setLoading(false);
        setShowPin(false);
        return;
      }
      const id = 'TX' + Date.now();
      // Save as PENDING — admin must approve before balance deduction & receipt
      await base44.entities.Transaction.create({
        user_id: me.id, user_email: me.email, type: 'mobile_banking',
        amount: Number(amount), currency: me.currency || 'BDT',
        status: 'pending', tx_id: id,
        description: `${p.name} - ${type}`,
        provider: p.id, recipient_mobile: mobile,
      });
      setTxId(id);
      setSuccess(true);
    } catch { setError('Transaction failed! Try again.'); }
    setLoading(false);
  };



  if (success) {
    return (
      <div className={`w-screen min-h-screen overflow-x-hidden bg-gradient-to-br ${p.gradient} flex flex-col items-center justify-center font-inter p-6`}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="text-center">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={56} className="text-white" />
          </div>
          <h2 className="text-white text-2xl font-extrabold mb-2">Request Submitted!</h2>
          <p className="text-white/80 text-sm mb-1">৳{amount} → {mobile}</p>
          <p className="text-white/60 text-xs mb-1">via {p.name} · {type}</p>
          <p className="text-white/40 text-[10px] mb-3">TX: {txId}</p>
          <div className="bg-white/15 rounded-2xl px-5 py-3 mb-8 mx-auto max-w-xs">
            <p className="text-white font-bold text-sm">⏳ Pending Admin Approval</p>
            <p className="text-white/60 text-xs mt-1">অ্যাডমিন অনুমোদনের পরে আপনার ট্রানজেকশন সম্পন্ন হবে এবং রিসিট পাওয়া যাবে।</p>
          </div>
          <button onClick={() => navigate('/')}
            className="bg-white/20 border border-white/40 text-white px-8 py-3.5 rounded-2xl font-bold w-full max-w-[260px]">
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <TxNotificationToast notification={notification} onClose={() => setNotification(null)} />

      <div className="w-screen overflow-x-hidden min-h-screen bg-gray-50 font-inter">
        {/* Branded Header */}
        <div className={`bg-gradient-to-br ${p.gradient} px-5 pt-[max(3rem,env(safe-area-inset-top,3rem))] pb-8 relative overflow-hidden`}>
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="flex items-center gap-3 relative z-10">
            <button onClick={() => navigate(-1)} className="p-2 bg-white/20 rounded-full text-white">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-white rounded-xl overflow-hidden shadow-lg shrink-0">
                <img src={p.logo} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-white font-extrabold text-xl leading-tight">{p.name}</h1>
                <p className="text-white/60 text-[10px]">{p.tagline}</p>
              </div>
            </div>
          </div>
          {userBalance !== null && (
            <div className="mt-4 bg-white/15 rounded-2xl px-4 py-2.5 inline-flex items-center gap-2 relative z-10">
              <span className="text-white/60 text-[10px] font-bold">Balance:</span>
              <span className="text-white font-extrabold text-sm">৳{userBalance.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Receiver Number */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-[11px] font-extrabold text-gray-500 mb-2 uppercase tracking-wider">Receiver's Number</p>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 ${p.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <span className="text-white text-xs font-extrabold">01</span>
              </div>
              <input
                type="tel"
                value={mobile}
                onChange={e => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 11)); setError(''); }}
                placeholder="01XXXXXXXXX"
                className={`flex-1 text-lg font-bold outline-none border-b-2 border-gray-200 ${p.focus} pb-1.5 bg-transparent placeholder:text-gray-300 transition-colors`}
              />
            </div>
          </div>

          {/* Amount */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-[11px] font-extrabold text-gray-500 mb-2 uppercase tracking-wider">Amount (BDT)</p>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-extrabold text-gray-300">৳</span>
              <input
                type="number"
                value={amount}
                onChange={e => { setAmount(e.target.value); setError(''); setInsufficientBalance(false); }}
                placeholder="0"
                className="flex-1 text-3xl font-extrabold text-gray-800 outline-none bg-transparent placeholder:text-gray-200"
              />
            </div>
            <div className="flex gap-2">
              {[500, 1000, 2000, 5000].map(a => (
                <button key={a} onClick={() => setAmount(String(a))}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border ${amount === String(a) ? `${p.bg} text-white border-transparent` : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  ৳{a}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction Type */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-[11px] font-extrabold text-gray-500 mb-3 uppercase tracking-wider">Transaction Type</p>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map(t => (
                <button key={t.id} onClick={() => setType(t.id)}
                  className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all flex flex-col items-center gap-1 ${type === t.id ? `${p.border} ${p.light} ${p.text}` : 'border-gray-100 bg-gray-50 text-gray-500'}`}>
                  <span className="text-base">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Insufficient Balance Warning */}
          {insufficientBalance && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-red-700 text-sm">Insufficient Balance</p>
                <p className="text-red-500 text-xs mt-0.5">আপনার ব্যালেন্স পর্যাপ্ত নয়।</p>
              </div>
              <button onClick={() => navigate('/add-money')}
                className="flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">
                <Plus size={12} /> Add Money
              </button>
            </motion.div>
          )}

          {error && (
            <p className="text-red-500 text-xs font-medium text-center">{error}</p>
          )}

          {/* Send Button */}
          <button onClick={handleSend}
            className={`w-full ${p.btn} text-white py-4 rounded-2xl font-extrabold text-base shadow-lg active:scale-95 transition-transform`}>
            Send Money →
          </button>
        </div>
      </div>

      {/* PIN Modal */}
      <AnimatePresence>
        {showPin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 overflow-hidden">
            <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} transition={{ type: 'spring', damping: 28 }}
              className="bg-white w-screen overflow-x-hidden max-w-[430px] rounded-t-3xl p-6 pb-10">
              <div className="w-14 h-14 rounded-2xl overflow-hidden mx-auto mb-4 shadow-lg">
                <img src={p.logo} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-extrabold text-lg text-center text-gray-800 mb-1">Confirm Transfer</h3>
              <p className="text-center text-gray-500 text-sm mb-5">
                ৳{amount} → {mobile} ({type})
              </p>
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 mb-2 text-center">Enter Your PIN</p>
                <input
                   type="password"
                   value={pin}
                   onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(''); }}
                   placeholder="● ● ● ●"
                  autoFocus
                  disabled={pinBlocked}
                  className={`w-full text-center text-2xl tracking-[0.5em] border-2 ${pinError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'} ${p.focus} rounded-2xl py-3.5 outline-none font-bold transition-colors`}
                />
                {pinError && (
                  <div className="mt-2 space-y-1">
                    <p className={`text-xs font-bold text-center ${pinBlocked ? 'text-red-600' : 'text-red-500'}`}>
                      {pinBlocked ? '🔒 ' : '⚠️ '}{pinError}
                    </p>
                    {pinAttemptsLeft !== null && !pinBlocked && (
                      <div className="flex items-center justify-center gap-1.5">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="w-2.5 h-2.5 rounded-full"
                            style={{ background: i < pinAttemptsLeft ? '#ef4444' : '#fee2e2' }} />
                        ))}
                        <span className="text-[10px] font-bold text-red-500 ml-1">
                          {pinAttemptsLeft} attempt{pinAttemptsLeft !== 1 ? 's' : ''} left
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowPin(false); setPin(''); setPinError(''); setPinBlocked(false); setPinAttemptsLeft(null); }}
                  className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 font-bold text-gray-600">
                  Cancel
                </button>
                <button onClick={handleConfirm} disabled={loading || pin.length !== 4 || pinBlocked}
                  className={`flex-1 ${p.btn} text-white py-3.5 rounded-2xl font-extrabold disabled:opacity-40 shadow-lg`}>
                  {loading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}