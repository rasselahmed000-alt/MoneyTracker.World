import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronDown, AlertCircle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import TxNotificationToast from '../components/cellfin/TxNotificationToast';

// Brand color tints for each bank by short_code
// bg = light tint background, solid = dark bg for white-logo banks
const BANK_BRAND = {
  ABBL:  { bg: '#fff0f0', solid: false },  // AB Bank — red
  AGBK:  { bg: '#e8f5e9', solid: false },  // Agrani — green
  AIBL:  { bg: '#e8f5e9', solid: false },  // Al-Arafah — green
  BCBL:  { bg: '#fff3e0', solid: false },  // Bangladesh Commerce — orange
  BDBL:  { bg: '#e3f2fd', solid: false },  // Bangladesh Development — blue
  BKB:   { bg: '#e8f5e9', solid: false },  // Krishi Bank — green
  ALFH:  { bg: '#fff0f0', solid: false },  // Bank Alfalah — red
  BALB:  { bg: '#e3f2fd', solid: false },  // Bank Asia — blue
  BKSI:  { bg: '#e8f5e9', solid: false },  // BASIC — green
  BGCB:  { bg: '#fce4ec', solid: false },  // Bengal Commercial — red/pink
  BRAC:  { bg: '#e3f2fd', solid: false },  // BRAC Bank — blue
  CITI:  { bg: '#e3f2fd', solid: false },  // Citibank — blue
  CIZS:  { bg: '#fff0f0', solid: false },  // Citizens Bank — red
  CIBL:  { bg: '#fff0f0', solid: false },  // City Bank — red
  CCEY:  { bg: '#e3f2fd', solid: false },  // Commercial Bank of Ceylon — blue
  COMM:  { bg: '#e8f5e9', solid: false },  // Community Bank — green
  DHBL:  { bg: '#fff3e0', solid: false },  // Dhaka Bank — orange
  DBBL:  { bg: '#fff3e0', solid: false },  // Dutch-Bangla — orange
  EBL:   { bg: '#e3f2fd', solid: false },  // Eastern Bank — blue
  EXBK:  { bg: '#e8f5e9', solid: false },  // EXIM — green
  FSIBL: { bg: '#e8f5e9', solid: false },  // First Security Islami — green
  GIBL:  { bg: '#e8f5e9', solid: false },  // Global Islami — green
  HBL:   { bg: '#1a6b3c', solid: true  },  // Habib Bank — dark green (white logo)
  HSBC:  { bg: '#fff0f0', solid: false },  // HSBC — red
  ICBIB: { bg: '#e3f2fd', solid: false },  // ICB Islamic — blue
  IFIC:  { bg: '#e8f5e9', solid: false },  // IFIC — green
  IBBL:  { bg: '#e8f5e9', solid: false },  // Islami Bank — green
  JMBL:  { bg: '#fff3e0', solid: false },  // Jamuna — orange
  JBL:   { bg: '#e3f2fd', solid: false },  // Janata — blue
  MGBL:  { bg: '#e3f2fd', solid: false },  // Meghna — blue
  MBLB:  { bg: '#e3f2fd', solid: false },  // Mercantile — blue
  MDB:   { bg: '#e3f2fd', solid: false },  // Midland — blue
  MMBL:  { bg: '#fce4ec', solid: false },  // Modhumoti — pink
  MTBL:  { bg: '#e3f2fd', solid: false },  // Mutual Trust — blue
  NBL:   { bg: '#fff0f0', solid: false },  // National Bank — red
  NBPA:  { bg: '#1a3a6b', solid: true  },  // National Bank of Pakistan — dark blue (white logo)
  NCCL:  { bg: '#e3f2fd', solid: false },  // NCC — blue
  NRBD:  { bg: '#e3f2fd', solid: false },  // NRB Bank — blue
  NRBC:  { bg: '#fff3e0', solid: false },  // NRB Commercial — orange
  OBL:   { bg: '#e8f5e9', solid: false },  // One Bank — green
  PDBL:  { bg: '#fce4ec', solid: false },  // Padma — pink/red
  PRMR:  { bg: '#e3f2fd', solid: false },  // Premier — blue
  PRBL:  { bg: '#e3f2fd', solid: false },  // Prime Bank — blue
  PKB:   { bg: '#e8f5e9', solid: false },  // Probashi Kallyan — green
  PBL:   { bg: '#fff0f0', solid: false },  // Pubali — red
  RAKUB: { bg: '#e8f5e9', solid: false },  // Rajshahi Krishi — green
  RBL:   { bg: '#fff0f0', solid: false },  // Rupali — red
  SBAC:  { bg: '#e8f5e9', solid: false },  // SBAC — green
  SJBL:  { bg: '#e8f5e9', solid: false },  // Shahjalal Islami — green
  SMBL:  { bg: '#e3f2fd', solid: false },  // Shimanto — blue
  SIBL:  { bg: '#e8f5e9', solid: false },  // Social Islami — green
  SBL:   { bg: '#e8f5e9', solid: false },  // Sonali — green
  SEBL:  { bg: '#e3f2fd', solid: false },  // Southeast — blue
  SDBL:  { bg: '#e3f2fd', solid: false },  // Standard Bank — blue
  SCB:   { bg: '#e8f5e9', solid: false },  // Standard Chartered — green
  SBIN:  { bg: '#fff0f0', solid: false },  // State Bank of India — red/blue
  TTBL:  { bg: '#e3f2fd', solid: false },  // Trust Bank — blue
  UBL:   { bg: '#e8f5e9', solid: false },  // Union Bank — green
  UCB:   { bg: '#e3f2fd', solid: false },  // United Commercial — blue
  UTBL:  { bg: '#e3f2fd', solid: false },  // Uttara — blue
  WOORI: { bg: '#fff0f0', solid: false },  // Woori — red
};

function getBankBg(bank) {
  const code = bank?.short_code?.toUpperCase();
  const brand = BANK_BRAND[code];
  if (!brand) return { bg: '#f1f5f9', solid: false };
  return brand;
}

export default function BankTransfer() {
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
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinBlocked, setPinBlocked] = useState(false);
  const [pinAttemptsLeft, setPinAttemptsLeft] = useState(null);
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [userBalance, setUserBalance] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.auth.me(),
      base44.entities.Bank.filter({ is_active: true }, 'sort_order', 100),
    ]).then(([u, bankList]) => {
      setUserBalance(u?.balance ?? 0);
      const list = bankList || [];
      setBanks(list);
      // Eagerly preload all bank logos so they're cached before dropdown opens
      list.forEach(b => {
        if (b.logo_url) {
          const img = new Image();
          img.src = b.logo_url;
        }
      });
    }).catch(() => {}).finally(() => setBanksLoading(false));
  }, []);

  const validate = () => {
    if (!bank) { setError('ব্যাংক সিলেক্ট করুন'); return false; }
    if (!holderName.trim()) { setError('অ্যাকাউন্ট হোল্ডারের নাম দিন'); return false; }
    if (accNo.length < 8) { setError('সঠিক অ্যাকাউন্ট নম্বর দিন (ন্যূনতম ৮ ডিজিট)'); return false; }
    if (!branch.trim()) { setError('ব্রাঞ্চের নাম দিন'); return false; }
    const minAmt = bank?.min_transfer_amount || 0;
    const effectiveMin = Math.max(minAmt, 100);
    if (!amount || Number(amount) < effectiveMin) {
      setError(minAmt > 0
        ? `এই ব্যাংকে সর্বনিম্ন ৳${minAmt.toLocaleString()} ট্রান্সফার করতে হবে`
        : 'সর্বনিম্ন ৳১০০ পাঠাতে হবে');
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
      // Verify PIN via backend
      const pinRes = await base44.functions.invoke('verifyPin', { pin });
      if (!pinRes.data?.success) {
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

      // Backend-level minimum transfer check (re-fetch bank to prevent bypass)
      const freshBank = await base44.entities.Bank.filter({ id: bank.id }, null, 1);
      const bankMinAmt = freshBank?.[0]?.min_transfer_amount || 0;
      if (bankMinAmt > 0 && Number(amount) < bankMinAmt) {
        setError(`এই ব্যাংকে সর্বনিম্ন ৳${bankMinAmt.toLocaleString()} ট্রান্সফার করতে হবে`);
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
        setError(`এই লেনদেন সম্পন্ন করা যাবে না। আপনার অ্যাকাউন্টে সর্বদা কমপক্ষে ৳${minBal.toLocaleString()} ব্যালেন্স রাখতে হবে।`);
        setLoading(false);
        setShowPin(false);
        return;
      }
      const id = 'TX' + Date.now();
      // Save as PENDING — admin must approve before balance deduction & receipt
      // Include all bank details for audit
      await base44.entities.Transaction.create({
        user_id: me.id, user_email: me.email, type: 'bank_transfer',
        amount: Number(amount), currency: 'BDT', status: 'pending', tx_id: id,
        description: `Bank Transfer to ${bank.name}`, 
        bank_name: bank.name, account_number: accNo, last_digits: accNo.slice(-4),
      });
      setTxId(id);
      setSuccess(true);
    } catch { setError('Transfer failed! Try again.'); }
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
          <p className="text-white/50 text-xs mb-1">Account: {accNo}</p>
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

      <div className="w-screen overflow-x-hidden max-w-[430px] mx-auto min-h-screen bg-gray-50 font-inter">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 px-5 pt-[max(3rem,env(safe-area-inset-top,3rem))] pb-7 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
          <div className="flex items-center gap-3 relative z-10">
            <button onClick={() => navigate(-1)} className="p-2 bg-white/15 rounded-full text-white">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-white rounded-xl overflow-hidden shadow-lg shrink-0">
                  <img src="https://media.base44.com/images/public/69fdabac102db66d741fa29f/5f387e2c8_1780440709009.png" alt="Bank Transfer" className="w-full h-full object-cover" />
                </div>
              <div>
                <h1 className="text-white font-extrabold text-xl leading-tight">Bank Transfer</h1>
                <p className="text-white/50 text-[10px]">Secure • Instant • Reliable</p>
              </div>
            </div>
          </div>
          {userBalance !== null && (
            <div className="mt-4 bg-white/10 rounded-2xl px-4 py-2.5 inline-flex items-center gap-2 relative z-10">
              <span className="text-white/50 text-[10px] font-bold">Balance:</span>
              <span className="text-white font-extrabold text-sm">৳{userBalance.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Select Bank */}
          <div className="relative">
            <button onClick={() => setShowBankDrop(!showBankDrop)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 active:bg-gray-50 transition-colors">
              {bank ? (
                <>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ background: getBankBg(bank).bg }}
                  >
                    {bank.logo_url ? (
                      <img
                        src={bank.logo_url}
                        alt={bank.name}
                        className="w-full h-full object-contain"
                        style={{
                          padding: getBankBg(bank).solid ? '4px' : '2px',
                          mixBlendMode: getBankBg(bank).solid ? 'normal' : 'multiply',
                        }}
                        loading="eager"
                        decoding="sync"
                      />
                    ) : (
                      <span className="text-white font-black text-sm">{(bank.short_code || bank.name || '?')[0]}</span>
                    )}
                  </div>
                  <span className="flex-1 text-left font-bold text-gray-800 text-sm">{bank.name}</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 text-xl">🏦</div>
                  <span className="flex-1 text-left text-gray-400 text-sm font-medium">
                    {banksLoading ? 'Loading banks...' : 'Select Bank'}
                  </span>
                </>
              )}
              <ChevronDown size={18} className={`text-gray-400 transition-transform duration-200 ${showBankDrop ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showBankDrop && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scaleY: 0.96 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={{ opacity: 0, y: -6, scaleY: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 z-30 bg-white rounded-2xl shadow-2xl border border-gray-100 mt-1.5 overflow-hidden"
                  style={{ maxHeight: '56vh', overflowY: 'auto', transformOrigin: 'top' }}
                >
                  {banks.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">No banks available.</div>
                  ) : banks.map(b => {
                    const brand = getBankBg(b);
                    return (
                      <button key={b.id}
                        onClick={() => { setBank(b); setShowBankDrop(false); setError(''); }}
                        className="w-full flex items-center gap-3.5 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-gray-50 last:border-0">
                        {/* Logo — 48×48 brand-tint bg, eager loaded */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                          style={{ background: brand.solid ? brand.bg : brand.bg }}
                        >
                          {b.logo_url ? (
                            <img
                              src={b.logo_url}
                              alt={b.name}
                              className="w-full h-full object-contain"
                              style={{
                                padding: brand.solid ? '4px' : '2px',
                                mixBlendMode: brand.solid ? 'normal' : 'multiply',
                              }}
                              loading="eager"
                              decoding="sync"
                              fetchPriority="high"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentNode.style.background = '#334155';
                                const fb = e.target.parentNode.querySelector('.logo-fallback');
                                if (fb) fb.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="logo-fallback w-full h-full items-center justify-center rounded-xl"
                            style={{ display: b.logo_url ? 'none' : 'flex', background: '#334155' }}
                          >
                            <span className="text-white font-black text-xs">{(b.short_code || b.name || '?')[0]}</span>
                          </div>
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">{b.name}</p>
                          {b.short_code && <p className="text-[10px] text-gray-400 font-semibold">{b.short_code}</p>}
                        </div>
                        {b.min_transfer_amount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                            Min ৳{b.min_transfer_amount.toLocaleString()}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Min Transfer Info */}
          {bank && bank.min_transfer_amount > 0 && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <span className="text-amber-500 text-base">⚠️</span>
              <p className="text-amber-700 text-xs font-bold">
                এই ব্যাংকে সর্বনিম্ন <span className="text-amber-800">৳{bank.min_transfer_amount.toLocaleString()} BDT</span> ট্রান্সফার করতে হবে
              </p>
            </motion.div>
          )}

          {/* Account Holder Name */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-[11px] font-extrabold text-gray-500 mb-2 uppercase tracking-wider">Account Holder Name</p>
            <input type="text" value={holderName} onChange={e => { setHolderName(e.target.value); setError(''); }}
              placeholder="Full name on account"
              className="w-full text-base font-semibold text-gray-800 outline-none border-b-2 border-gray-200 focus:border-slate-600 pb-1.5 bg-transparent placeholder:text-gray-300 transition-colors" />
          </div>

          {/* Account Number */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-[11px] font-extrabold text-gray-500 mb-2 uppercase tracking-wider">Account Number</p>
            <input type="tel" value={accNo} onChange={e => { setAccNo(e.target.value.replace(/\D/g, '').slice(0, 20)); setError(''); }}
              placeholder="Enter account number"
              className="w-full text-base font-semibold text-gray-800 outline-none border-b-2 border-gray-200 focus:border-slate-600 pb-1.5 bg-transparent placeholder:text-gray-300 transition-colors" />
            <p className="text-[10px] text-gray-400 mt-1">{accNo.length}/20 digits</p>
          </div>

          {/* Branch */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-[11px] font-extrabold text-gray-500 mb-2 uppercase tracking-wider">Branch Name</p>
            <input type="text" value={branch} onChange={e => { setBranch(e.target.value); setError(''); }}
              placeholder="e.g. Mirpur, Dhaka"
              className="w-full text-base font-semibold text-gray-800 outline-none border-b-2 border-gray-200 focus:border-slate-600 pb-1.5 bg-transparent placeholder:text-gray-300 transition-colors" />
          </div>

          {/* Amount */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-[11px] font-extrabold text-gray-500 mb-2 uppercase tracking-wider">Amount (BDT)</p>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-3xl font-extrabold text-gray-300">৳</span>
              <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setError(''); setInsufficientBalance(false); }}
                placeholder="0"
                className="flex-1 text-3xl font-extrabold text-gray-800 outline-none bg-transparent placeholder:text-gray-200" />
            </div>
            <div className="flex gap-2">
              {[500, 1000, 2000, 5000].map(a => (
                <button key={a} onClick={() => setAmount(String(a))}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${amount === String(a) ? 'bg-slate-700 text-white border-transparent' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  ৳{a}
                </button>
              ))}
            </div>
          </div>

          {/* Insufficient Balance */}
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

          {error && <p className="text-red-500 text-xs font-medium text-center">{error}</p>}

          <button onClick={handleSend}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-2xl font-extrabold text-base shadow-lg active:scale-95 transition-transform">
            Transfer Now →
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
              <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl">🏦</span>
              </div>
              <h3 className="font-extrabold text-lg text-center text-gray-800 mb-1">Confirm Transfer</h3>
              <p className="text-center text-gray-500 text-sm mb-5">
                ৳{amount} → {bank?.name}
              </p>
              <div className="bg-gray-50 rounded-2xl p-3 mb-5 space-y-2">
                {[['Account', accNo], ['Branch', branch], ['Name', holderName]].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-gray-400">{k}</span>
                    <span className="font-bold text-gray-700">{v}</span>
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 mb-2 text-center">Enter Your PIN</p>
                <input type="password" value={pin}
                   onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(''); }}
                   placeholder="● ● ● ●" autoFocus disabled={pinBlocked}
                  className={`w-full text-center text-2xl tracking-[0.5em] border-2 ${pinError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'} focus:border-slate-600 rounded-2xl py-3.5 outline-none font-bold transition-colors`} />
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
                  className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 font-bold text-gray-600">Cancel</button>
                <button onClick={handleConfirm} disabled={loading || pin.length !== 4 || pinBlocked}
                  className="flex-1 bg-slate-800 text-white py-3.5 rounded-2xl font-extrabold disabled:opacity-40 shadow-lg">
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