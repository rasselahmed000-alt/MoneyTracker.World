import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronDown, AlertCircle, Plus } from 'lucide-react';
import UniversalHeader from '@/components/cellfin/UniversalHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';


// Bank branding colors
const BANK_BRAND = {
  ABBL:  { bg: '#ffffff', color: '#dc2626' },
  AGBK:  { bg: '#ffffff', color: '#059669' },
  AIBL:  { bg: '#ffffff', color: '#059669' },
  BRAC:  { bg: '#ffffff', color: '#2563eb' },
  DBBL:  { bg: '#ffffff', color: '#f97316' },
  EBL:   { bg: '#ffffff', color: '#2563eb' },
  IBBL:  { bg: '#ffffff', color: '#059669' },
  HBL:   { bg: '#ffffff', color: '#10b981' },
};

function getBankBg(bank) {
  const code = bank?.short_code?.toUpperCase();
  const brand = BANK_BRAND[code];
  if (!brand) return { bg: '#f1f5f9', color: '#64748b' };
  return brand;
}

export default function BankTransferOptimized() {
  const navigate = useNavigate();
  const [banks, setBanks] = useState([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [bank, setBank] = useState(null);
  const [showBankDrop, setShowBankDrop] = useState(false);
  const [holderName, setHolderName] = useState('');
  const [accNo, setAccNo] = useState('');
  const [branch, setBranch] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txId, setTxId] = useState('');
  const [error, setError] = useState('');
  const [pinError, setPinError] = useState('');
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const { user: authUser } = useAuth();
  const [liveUser, setLiveUser] = useState(null);
  const user = liveUser || authUser;

  useEffect(() => {
    base44.entities.Bank.filter({ is_active: true }, 'sort_order', 100)
      .then(bankList => {
        setBanks(bankList || []);
        // Preload logos
        (bankList || []).forEach(b => {
          if (b.logo_url) { const img = new Image(); img.src = b.logo_url; }
        });
      })
      .catch(() => {})
      .finally(() => setBanksLoading(false));
  }, []);

  const validate = () => {
    if (!bank) {
      setError('Select a bank');
      return false;
    }
    if (!holderName.trim()) {
      setError('Enter account holder name');
      return false;
    }
    if (accNo.length < 8) {
      setError('Valid account number (min 8 digits)');
      return false;
    }
    if (!branch.trim()) {
      setError('Enter branch name');
      return false;
    }
    const minAmt = bank?.min_transfer_amount || 0;
    const effectiveMin = Math.max(minAmt, 100);
    if (!amount || Number(amount) < effectiveMin) {
      setError(minAmt > 0 ? `Minimum ৳${minAmt.toLocaleString()}` : 'Minimum ৳100');
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

      // Use already-loaded bank min amount (avoid extra DB call)
      const bankMinAmt = bank?.min_transfer_amount || 0;
      if (bankMinAmt > 0 && Number(amount) < bankMinAmt) {
        setError(`Minimum ৳${bankMinAmt.toLocaleString()}`);
        setLoading(false);
        setShowPin(false);
        return;
      }

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
        type: 'bank_transfer',
        amount: Number(amount),
        currency: 'BDT',
        status: 'pending',
        tx_id: id,
        description: `Bank Transfer to ${bank.name}`,
        bank_name: bank.name,
        account_number: accNo,
        last_digits: accNo.slice(-4),
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
      <div className="w-screen overflow-x-hidden max-w-[430px] mx-auto min-h-screen bg-gradient-to-br from-slate-800 to-slate-600 flex flex-col items-center justify-center font-inter p-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="text-center">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={56} className="text-white" />
          </div>
          <h2 className="text-white text-2xl font-extrabold mb-2">Request Submitted!</h2>
          <p className="text-white/80 text-sm mb-1">৳{amount} → {bank?.name}</p>
          <p className="text-white/40 text-[10px] mb-3">TX: {txId}</p>

          <button onClick={() => navigate('/')} className="bg-white/20 border border-white/40 text-white px-8 py-3.5 rounded-2xl font-bold w-full max-w-[260px]">
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="w-screen overflow-x-hidden max-w-[430px] mx-auto min-h-screen bg-gray-50 font-inter">
        {/* Universal Header */}
        <UniversalHeader
          title="Bank Transfer"
          subtitle="Secure • Instant • Reliable"
          gradient="linear-gradient(135deg, #1e293b 0%, #334155 100%)"
          rightAction={user ? (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 text-white">৳{(user.balance ?? 0).toLocaleString()}</span>
          ) : null}
        />

        <div className="px-5 space-y-4 pb-24" style={{ paddingTop: 'calc(4.5rem + env(safe-area-inset-top))' }}>
          {/* Select Bank */}
          <div className="relative">
            <button
              onClick={() => setShowBankDrop(!showBankDrop)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 active:bg-gray-50 transition-colors"
            >
              {bank ? (
                <>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden" style={{ background: getBankBg(bank).bg }}>
                    {bank.logo_url ? (
                      <img src={bank.logo_url} alt={bank.name} className="w-full h-full object-contain" loading="eager" />
                    ) : (
                      <span className="text-white font-black text-sm">{(bank.short_code || bank.name || '?')[0]}</span>
                    )}
                  </div>
                  <span className="flex-1 text-left font-bold text-gray-800 text-sm">{bank.name}</span>
                </>
              ) : banksLoading ? (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-gray-200 shrink-0" />
                  <span className="flex-1 font-bold text-gray-400 text-sm">Loading banks...</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 text-xl">🏦</div>
                  <span className="flex-1 text-left text-gray-400 text-sm font-medium">Select Bank</span>
                </>
              )}
              <ChevronDown size={18} className={`text-gray-400 transition-transform ${showBankDrop ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showBankDrop && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scaleY: 0.96 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={{ opacity: 0, y: -6, scaleY: 0.96 }}
                  className="absolute top-full left-0 right-0 z-30 bg-white rounded-2xl shadow-2xl border border-gray-100 mt-1.5 overflow-hidden"
                  style={{ maxHeight: '56vh', overflowY: 'auto' }}
                >
                  {banks.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">No banks available</div>
                  ) : (
                    banks.map(b => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setBank(b);
                          setShowBankDrop(false);
                          setError('');
                        }}
                        className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 border-b border-gray-100 last:border-0"
                      >
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm" style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>
                          {b.logo_url ? (
                            <img src={b.logo_url} alt={b.name} className="w-10 h-10 object-contain" loading="eager" />
                          ) : (
                            <span className="text-slate-600 font-bold text-sm">{(b.short_code || b.name || '?')[0]}</span>
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">{b.name}</p>
                          {b.short_code && <p className="text-[10px] text-gray-400">{b.short_code}</p>}
                        </div>
                        {b.min_transfer_amount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                            Min ৳{b.min_transfer_amount.toLocaleString()}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Account Holder Name */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-[11px] font-extrabold text-gray-500 mb-2 uppercase tracking-wider">Account Holder Name</p>
            <input
              type="text"
              value={holderName}
              onChange={e => { setHolderName(e.target.value); setError(''); }}
              placeholder="Full name on account"
              className="w-full text-base font-semibold text-gray-800 outline-none border-b-2 border-gray-200 focus:border-slate-600 pb-1.5 bg-transparent placeholder:text-gray-300 transition-colors"
            />
          </div>

          {/* Account Number */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-[11px] font-extrabold text-gray-500 mb-2 uppercase tracking-wider">Account Number</p>
            <input
              type="tel"
              value={accNo}
              onChange={e => { setAccNo(e.target.value.replace(/\D/g, '').slice(0, 20)); setError(''); }}
              placeholder="Enter account number"
              className="w-full text-base font-semibold text-gray-800 outline-none border-b-2 border-gray-200 focus:border-slate-600 pb-1.5 bg-transparent placeholder:text-gray-300 transition-colors"
            />
            <p className="text-[10px] text-gray-400 mt-1">{accNo.length}/20 digits</p>
          </div>

          {/* Branch */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-[11px] font-extrabold text-gray-500 mb-2 uppercase tracking-wider">Branch Name</p>
            <input
              type="text"
              value={branch}
              onChange={e => { setBranch(e.target.value); setError(''); }}
              placeholder="e.g. Mirpur, Dhaka"
              className="w-full text-base font-semibold text-gray-800 outline-none border-b-2 border-gray-200 focus:border-slate-600 pb-1.5 bg-transparent placeholder:text-gray-300 transition-colors"
            />
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
                <button
                  key={a}
                  onClick={() => setAmount(String(a))}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    amount === String(a) ? 'bg-slate-700 text-white border-transparent' : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  ৳{a}
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
              <button
                onClick={() => navigate('/add-money')}
                className="flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shrink-0"
              >
                <Plus size={12} /> Add Money
              </button>
            </motion.div>
          )}

          {error && <p className="text-red-500 text-xs font-medium text-center">{error}</p>}

          <button
            onClick={handleSend}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-2xl font-extrabold text-base shadow-lg active:scale-95 transition-transform"
          >
            Transfer Now →
          </button>
        </div>
      </div>

      {/* PIN Modal */}
      <AnimatePresence>
        {showPin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 overflow-hidden">
            <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} transition={{ type: 'spring', damping: 28 }} className="bg-white w-screen overflow-x-hidden max-w-[430px] rounded-t-3xl p-6 pb-10">
              <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl">🏦</span>
              </div>
              <h3 className="font-extrabold text-lg text-center text-gray-800 mb-1">Confirm Transfer</h3>
              <p className="text-center text-gray-500 text-sm mb-5">৳{amount} → {bank?.name}</p>
              <div className="bg-gray-50 rounded-2xl p-3 mb-5 space-y-2 text-xs">
                {[['Account', accNo], ['Branch', branch], ['Name', holderName]].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-gray-400">{k}</span>
                    <span className="font-bold text-gray-700">{v}</span>
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 mb-2 text-center">Enter Your PIN</p>
                <input
                  type="password"
                  value={pin}
                  onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(''); }}
                  placeholder="● ● ● ●"
                  autoFocus
                  className={`w-full text-center text-2xl tracking-[0.5em] border-2 rounded-2xl py-3.5 outline-none font-bold transition-colors ${
                    pinError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-slate-600'
                  }`}
                />
                {pinError && <p className="text-red-500 text-xs font-bold text-center mt-2">⚠️ {pinError}</p>}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowPin(false); setPin(''); setPinError(''); }}
                  className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || pin.length !== 4}
                  className="flex-1 bg-slate-800 text-white py-3.5 rounded-2xl font-extrabold disabled:opacity-40 shadow-lg"
                >
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