import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, AlertCircle, Plus } from 'lucide-react';
import UniversalHeader from '@/components/cellfin/UniversalHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

// Official brand config — matches real app branding
const PROVIDER_CONFIG = {
  bkash: {
    name: 'bKash',
    color: '#e2136e',
    gradient: 'linear-gradient(135deg, #e2136e 0%, #c41060 100%)',
    light: '#fce8f3',
    logo: 'https://media.base44.com/images/public/69fdabac102db66d741fa29f/87535a6b9_1780440626277.png',
  },
  nagad: {
    name: 'Nagad',
    color: '#f7941d',
    gradient: 'linear-gradient(135deg, #f7941d 0%, #e67e0b 100%)',
    light: '#fef3e2',
    logo: 'https://media.base44.com/images/public/69fdabac102db66d741fa29f/30d2abd72_1780440344814.png',
  },
  rocket: {
    name: 'Rocket',
    color: '#6d28d9',
    gradient: 'linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%)',
    light: '#f3e8ff',
    logo: 'https://media.base44.com/images/public/69fdabac102db66d741fa29f/6344c9b81_IMG_20260603_045402_210.png',
  },
};

const TRANSACTION_TYPES = [
  { value: 'personal', label: 'Personal Transfer' },
  { value: 'agent', label: 'Agent' },
  { value: 'merchant', label: 'Merchant' },
];

export default function MobileBankingTransfer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const provider = searchParams.get('provider') || 'bkash';
  const config = PROVIDER_CONFIG[provider] || PROVIDER_CONFIG.bkash;

  const [number, setNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('personal');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [pinError, setPinError] = useState('');
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const { user: authUser } = useAuth();
  const [liveUser, setLiveUser] = useState(null);
  const user = liveUser || authUser;
  const [txId, setTxId] = useState('');

  const validate = () => {
    if (number.length < 10) {
      setError('Enter valid mobile number');
      return false;
    }
    if (!amount || Number(amount) < 10) {
      setError('Minimum amount ৳10');
      return false;
    }
    return true;
  };

  const handleSend = () => {
    setError('');
    setInsufficientBalance(false);
    if (!validate()) return;
    setShowPin(true);
  };

  const handleConfirm = async () => {
    if (pin.length !== 4) return;
    setLoading(true);
    setPinError('');
    try {
      const pinRes = await base44.functions.invoke('verifyPin', { pin });
      if (!pinRes.data?.success) {
        if (pinRes.data?.no_pin) {
          setPinError('PIN সেট করা নেই। Profile → Set PIN করুন।');
        } else {
          setPinError(pinRes.data?.error || 'Wrong PIN');
        }
        setLoading(false);
        return;
      }

      // Fetch fresh balance for accurate check
      const me = await base44.auth.me();
      setLiveUser(me);
      const bal = me?.balance ?? 0;
      const minBal = me?.min_balance ?? 0;

      if (bal < Number(amount)) {
        setInsufficientBalance(true);
        setLoading(false);
        setShowPin(false);
        return;
      }

      if (minBal > 0 && (bal - Number(amount)) < minBal) {
        setError(`Keep minimum balance ৳${minBal.toLocaleString()}`);
        setLoading(false);
        setShowPin(false);
        return;
      }

      const id = 'TX' + Date.now();
      await base44.entities.Transaction.create({
        user_id: me.id,
        user_email: me.email,
        type: 'mobile_banking',
        amount: Number(amount),
        currency: 'BDT',
        status: 'pending',
        tx_id: id,
        provider: provider.toUpperCase(),
        recipient_mobile: number,
        description: `${config.name} - ${type}`,
      });

      setTxId(id);
      setSuccess(true);
    } catch (err) {
      setError(err?.message || 'Transfer failed');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="w-screen overflow-x-hidden max-w-[430px] mx-auto min-h-screen flex flex-col items-center justify-center font-inter p-6" style={{ background: config.light }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: config.color }}>
            <Check size={40} className="text-white" />
          </div>
          <h2 className="text-lg font-extrabold mb-2" style={{ color: config.color }}>Request Submitted!</h2>
          <p className="text-sm text-gray-600 mb-1">৳{Number(amount).toLocaleString()} to {number}</p>
          <p className="text-xs text-gray-400 mb-4">TX: {txId}</p>

          <button onClick={() => navigate('/')} className="text-white font-bold px-8 py-3.5 rounded-2xl w-full max-w-[260px]" style={{ background: config.gradient }}>
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-screen overflow-x-hidden max-w-[430px] mx-auto min-h-screen bg-gray-50 font-inter">
      {/* Universal Header with brand color */}
      <UniversalHeader
        title={config.name}
        subtitle="Secure • Instant • Reliable"
        gradient={config.gradient}
        rightAction={
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-sm">
            <img src={config.logo} alt={config.name} className="w-full h-full object-contain" loading="eager" />
          </div>
        }
      />
      {user && (
        <div className="mx-5 bg-white rounded-2xl px-4 py-2.5 inline-flex items-center gap-2 shadow-sm border border-gray-100" style={{ marginTop: 'calc(4.5rem + env(safe-area-inset-top))' }}>
          <span className="text-gray-400 text-[10px] font-bold">Balance:</span>
          <span className="font-extrabold text-sm" style={{ color: config.color }}>৳{(user.balance ?? 0).toLocaleString()}</span>
        </div>
      )}

      <div className="px-5 py-5 space-y-4 pb-24" style={!user ? { paddingTop: 'calc(4.5rem + env(safe-area-inset-top))' } : {}}>
        {/* Receiver Number */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-[11px] font-extrabold text-gray-500 mb-2 uppercase tracking-wider">Receiver Number</p>
          <input
            type="tel"
            value={number}
            onChange={(e) => { setNumber(e.target.value.replace(/\D/g, '').slice(0, 11)); setError(''); }}
            placeholder="01XXX-XXXXXX"
            className="w-full text-lg font-semibold text-gray-800 outline-none border-b-2 border-gray-200 focus:border-gray-800 pb-1.5 bg-transparent placeholder:text-gray-300 transition-colors"
          />
          <p className="text-[10px] text-gray-400 mt-1">{number.length}/11 digits</p>
        </div>

        {/* Amount */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-[11px] font-extrabold text-gray-500 mb-2 uppercase tracking-wider">Amount (BDT)</p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-3xl font-extrabold text-gray-300">৳</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(''); setInsufficientBalance(false); }}
              placeholder="0"
              className="flex-1 text-3xl font-extrabold text-gray-800 outline-none bg-transparent placeholder:text-gray-200"
            />
          </div>
          <div className="flex gap-2">
            {[100, 500, 1000, 5000].map(a => (
              <button
                key={a}
                onClick={() => setAmount(String(a))}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  amount === String(a) ? 'text-white border-transparent' : 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
                style={amount === String(a) ? { background: config.color } : {}}
              >
                ৳{a}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction Type */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-[11px] font-extrabold text-gray-500 mb-3 uppercase tracking-wider">Transaction Type</p>
          <div className="space-y-2">
            {TRANSACTION_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`w-full p-3 rounded-xl text-sm font-bold border-2 transition-all text-left ${
                  type === t.value
                    ? 'text-white border-transparent'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
                style={type === t.value ? { background: config.color } : {}}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Insufficient Balance */}
        {insufficientBalance && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-red-700 text-sm">Insufficient Balance</p>
              <p className="text-red-500 text-xs mt-0.5">আপনার ব্যালেন্স পর্যাপ্ত নয়</p>
            </div>
            <button onClick={() => navigate('/add-money')} className="flex items-center gap-1 text-white px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 bg-red-500">
              <Plus size={12} /> Add Money
            </button>
          </motion.div>
        )}

        {error && <p className="text-red-500 text-xs font-medium text-center">{error}</p>}

        <button
          onClick={handleSend}
          className="w-full text-white py-4 rounded-2xl font-extrabold text-base shadow-lg active:scale-95 transition-transform"
          style={{ background: config.gradient }}
        >
          Send Now →
        </button>
      </div>

      {/* PIN Modal */}
      <AnimatePresence>
        {showPin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 overflow-hidden">
            <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} transition={{ type: 'spring', damping: 28 }} className="bg-white w-screen overflow-x-hidden max-w-[430px] rounded-t-3xl p-6 pb-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ background: config.color }}>
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="font-extrabold text-lg text-center text-gray-800 mb-1">Confirm Transfer</h3>
              <p className="text-center text-gray-500 text-sm mb-5">
                ৳{amount} to {number}
              </p>
              <div className="bg-gray-50 rounded-2xl p-3 mb-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Provider</span>
                  <span className="font-bold text-gray-700">{config.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="font-bold text-gray-700">{TRANSACTION_TYPES.find(t => t.value === type)?.label}</span>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 mb-2 text-center">Enter Your PIN</p>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(''); }}
                  placeholder="● ● ● ●"
                  autoFocus
                  className={`w-full text-center text-2xl tracking-[0.5em] border-2 rounded-2xl py-3.5 outline-none font-bold transition-colors ${
                    pinError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-gray-800'
                  }`}
                />
                {pinError && <p className="text-red-500 text-xs font-bold text-center mt-2">⚠️ {pinError}</p>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowPin(false); setPin(''); setPinError(''); }} className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 font-bold text-gray-600">
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || pin.length !== 4}
                  className="flex-1 text-white py-3.5 rounded-2xl font-extrabold disabled:opacity-40 shadow-lg"
                  style={{ background: config.gradient }}
                >
                  {loading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}