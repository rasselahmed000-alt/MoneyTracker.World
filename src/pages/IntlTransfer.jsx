import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertCircle, Plus, ChevronRight } from 'lucide-react';
import UniversalHeader from '@/components/cellfin/UniversalHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

function parseFields(raw) {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

// Reusable logo component with image + fallback initial
function MethodLogo({ method: m, size = 48 }) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const s = size;
  const radius = Math.round(s * 0.38);
  const hasLogo = m.logo_url && !imgError;
  return (
    <div
      className="flex items-center justify-center shrink-0 overflow-hidden font-black text-white shadow-md relative"
      style={{
        width: s, height: s,
        borderRadius: radius,
        background: m.color || '#6b7280',
        fontSize: s * 0.38,
      }}
    >
      {hasLogo ? (
        <>
          {!imgLoaded && <span className="absolute">{(m.name || '?')[0]}</span>}
          <img
            src={m.logo_url}
            alt={m.name}
            className="w-full h-full object-cover"
            style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.2s' }}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        </>
      ) : (
        <span>{(m.name || '?')[0]}</span>
      )}
    </div>
  );
}

// ─── Step 1: Method Selection ─────────────────────────────────────────────────
function MethodSelector({ country, methods, onSelect }) {
  const brandColor = '#10b981';
  return (
    <div className="w-screen overflow-x-hidden max-w-[430px] mx-auto min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <div className="relative overflow-hidden px-5 pt-[max(1.5rem,env(safe-area-inset-top,1.5rem))] pb-4"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)' }}>
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5" />
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => window.history.back()} className="p-2 bg-white/20 rounded-full text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-white font-black text-xl leading-tight">
              {country.flag_emoji} {country.name}
            </h1>
            <p className="text-white/50 text-[11px]">Select payment method</p>
          </div>
        </div>
        {/* Rate */}
        <div className="mt-4 flex gap-3 relative z-10">
          <div className="bg-white/10 rounded-xl px-3 py-2 flex-1 text-center">
            <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Rate</p>
            <p className="text-white font-black text-sm">1 {country.currency_code} = ৳{country.exchange_rate}</p>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-2 flex-1 text-center">
            <p className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Fee</p>
            <p className={`font-black text-sm ${country.fee_percent > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
              {country.fee_percent > 0 ? `${country.fee_percent}%` : 'Free'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5">
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-3">
          Available Methods ({methods.length})
        </p>
        <div className="space-y-2.5">
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelect(m)}
              className="w-full flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <MethodLogo method={m} size={48} />
              <div className="flex-1 text-left">
                <p className="font-black text-gray-800 text-sm">{m.name}</p>
                <p className="text-[11px] text-gray-400">
                  {parseFields(m.required_fields).length} required fields
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function IntlTransfer() {
  const navigate = useNavigate();
  const location = useLocation();
  const qParams = new URLSearchParams(location.search);
  const preCountryId = qParams.get('country');
  const preMethodId = qParams.get('method');

  const { user: authUser } = useAuth();
  const [allCountries, setAllCountries] = useState([]);
  const [allMethods, setAllMethods] = useState([]);
  const [country, setCountry] = useState(null);
  const [method, setMethod] = useState(null);
  const [liveUser, setLiveUser] = useState(null);
  const user = liveUser || authUser;
  const [loadingData, setLoadingData] = useState(true);

  // Transfer form state
  const [amount, setAmount] = useState('');
  const [dynamicFields, setDynamicFields] = useState({});
  const [error, setError] = useState('');
  const [insufficientBalance, setInsufficientBalance] = useState(false);

  // PIN modal state
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinBlocked, setPinBlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Success state
  const [success, setSuccess] = useState(false);
  const [txId, setTxId] = useState('');

  useEffect(() => {
    Promise.all([
      base44.entities.IntlCountry.list('sort_order', 50),
      base44.entities.IntlPaymentMethod.list('sort_order', 100),
    ]).then(([ctrs, mths]) => {
      const activeCtrs = (ctrs || []).filter(c => c.is_active);
      const activeMths = (mths || []).filter(m => m.is_active);
      setAllCountries(activeCtrs);
      setAllMethods(activeMths);

      const c = preCountryId ? activeCtrs.find(x => x.id === preCountryId) : null;
      if (c) {
        setCountry(c);
        if (preMethodId) {
          const m = activeMths.find(x => x.id === preMethodId);
          if (m) setMethod(m);
        }
      }
    }).catch(() => {}).finally(() => setLoadingData(false));
  }, []);

  const countryMethods = country ? allMethods.filter(m => m.country_id === country.id) : [];
  const fields = parseFields(method?.required_fields);
  // exchange_rate = 1 BDT = X foreign currency
  // So: BDT amount * exchange_rate = foreign amount received
  const convertedAmount = country && amount && country.exchange_rate
    ? (Number(amount) * country.exchange_rate).toFixed(2)
    : null;
  const feeAmount = country && amount ? ((Number(amount) * (country.fee_percent || 0)) / 100).toFixed(2) : '0';
  const totalDeduct = Number(amount || 0) + Number(feeAmount);
  const accentColor = method?.color || '#10b981';

  const handleSend = () => {
    setError('');
    setInsufficientBalance(false);
    if (!amount || Number(amount) < (country?.min_transfer || 100)) {
      setError(`সর্বনিম্ন ৳${country?.min_transfer || 100} পাঠাতে হবে`);
      return;
    }
    if (Number(amount) > (country?.max_transfer || 50000)) {
      setError(`সর্বোচ্চ ৳${country?.max_transfer || 50000} পাঠানো যাবে`);
      return;
    }
    for (const f of fields) {
      if (!dynamicFields[f.key]?.trim()) {
        setError(`${f.label} দিন`);
        return;
      }
    }
    setShowPin(true);
  };

  const handleConfirm = async () => {
    if (pin.length < 4) return;
    setLoading(true);
    setPinError('');
    try {
      const pinRes = await base44.functions.invoke('verifyPin', { pin });
      if (!pinRes.data?.success) {
        setPinError(pinRes.data?.error || 'ভুল PIN!');
        setPinBlocked(!!pinRes.data?.blocked);
        setLoading(false);
        return;
      }
      // Fresh balance fetch for accurate check
      const me = await base44.auth.me();
      setLiveUser(me);
      const bal = me?.balance ?? 0;
      const minBal = me?.min_balance ?? 0;
      if (bal < totalDeduct) {
        setInsufficientBalance(true);
        setLoading(false);
        setShowPin(false);
        return;
      }
      if (minBal > 0 && (bal - totalDeduct) < minBal) {
        setError(`কমপক্ষে ৳${minBal.toLocaleString()} ব্যালেন্স রাখতে হবে।`);
        setLoading(false);
        setShowPin(false);
        return;
      }
      const id = 'ITX' + Date.now();
      const receiverInfo = fields.map(f => `${f.label}: ${dynamicFields[f.key] || ''}`).join(' | ');
      await base44.entities.Transaction.create({
        user_id: me.id,
        user_email: me.email,
        type: 'send',
        amount: totalDeduct,
        currency: me.currency || 'BDT',
        status: 'pending',
        tx_id: id,
        description: `Intl Transfer: ${method?.name} → ${country?.name}`,
        country: country?.name,
        recipient_mobile: receiverInfo,
        provider: method?.name,
      });
      await base44.functions.invoke('notifyAdminNewTransaction', {
        data: {
          user_email: me.email,
          type: 'intl_transfer',
          provider: method?.name,
          country: country?.name,
          currency_code: country?.currency_code,
          amount: totalDeduct,
          converted_amount: convertedAmount,
          receiver_info: receiverInfo,
          tx_id: id,
          currency: me.currency || 'BDT',
        },
        event: { entity_name: 'Transaction' }
      }).catch(() => {});
      setTxId(id);
      setSuccess(true);
    } catch { setError('Transfer failed! Try again.'); }
    setLoading(false);
  };

  // Loading skeleton
  if (loadingData) {
    return (
      <div className="w-screen overflow-x-hidden max-w-[430px] mx-auto min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Success screen
  if (success) {
    return (
      <div className="w-screen overflow-x-hidden max-w-[430px] mx-auto min-h-screen flex flex-col items-center justify-center p-6 font-inter"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #064e3b 100%)' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
          className="text-center w-full">
          <div className="w-24 h-24 bg-emerald-500/20 border-2 border-emerald-400/40 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={52} className="text-emerald-400" />
          </div>
          <h2 className="text-white text-2xl font-black mb-2">Request Submitted!</h2>
          <p className="text-white/70 text-sm mb-1">{country?.flag_emoji} {country?.name} · {method?.name}</p>
          <p className="text-white/50 text-xs mb-1">৳{amount} BDT → {convertedAmount} {country?.currency_code}</p>
           <p className="text-white/30 text-[10px] mb-1">Rate: 1 ৳ = {country?.exchange_rate} {country?.currency_code}</p>
          <p className="text-white/30 text-[10px] mb-6">TX: {txId}</p>
          <div className="bg-white/10 rounded-2xl p-4 mb-6 text-left border border-white/10">
            <p className="text-emerald-400 font-bold text-sm mb-1">⏳ Pending Admin Approval</p>
            <p className="text-white/50 text-xs">অ্যাডমিন অনুমোদনের পরে আপনার ট্রান্সফার সম্পন্ন হবে।</p>
          </div>
          <button onClick={() => navigate('/')}
            className="w-full py-4 rounded-2xl font-black text-white"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  // Step 1: No country selected (shouldn't happen from home, but fallback)
  if (!country) {
    return (
      <div className="w-screen overflow-x-hidden max-w-[430px] mx-auto min-h-screen bg-gray-50 font-inter">
        <UniversalHeader
          title="International Transfer"
          gradient="linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)"
        />
        <div className="px-4 py-5" style={{ paddingTop: 'calc(4.5rem + env(safe-area-inset-top))' }}>
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-3">Select Country</p>
          <div className="space-y-2.5">
            {allCountries.map((c) => (
              <button key={c.id}
                onClick={() => setCountry(c)}
                className="w-full flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <span className="text-3xl shrink-0">{c.flag_emoji}</span>
                      <div className="flex-1 text-left">
                        <p className="font-black text-gray-800">{c.name}</p>
                        <p className="text-xs text-gray-400">1 ৳ = {c.exchange_rate} {c.currency_code}</p>
                      </div>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Country selected, no method yet → show method list
  if (!method) {
    return (
      <MethodSelector
        country={country}
        methods={countryMethods}
        onSelect={setMethod}
      />
    );
  }

  // Step 3: Transfer form
  return (
    <div className="w-screen overflow-x-hidden max-w-[430px] mx-auto min-h-screen bg-gray-50 font-inter pb-10">
      {/* Universal Header */}
      <UniversalHeader
        title={method.name}
        subtitle={`${country.flag_emoji} ${country.name} · ${country.currency_code}`}
        gradient={`linear-gradient(135deg, ${accentColor}dd, ${accentColor}99)`}
        onBack={() => setMethod(null)}
        rightAction={user?.balance != null ? (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 text-white">৳{(user.balance || 0).toLocaleString()}</span>
        ) : null}
      />

      <div className="px-4 py-5 space-y-3" style={{ paddingTop: 'calc(4.5rem + env(safe-area-inset-top))' }}>
        {/* Amount Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">আপনি পাঠাচ্ছেন (BDT)</p>
          <div className="flex items-center gap-2 mb-3 bg-gray-50 rounded-2xl px-4 py-3 border-2 border-gray-100 focus-within:border-emerald-400 transition-colors">
            <span className="text-2xl font-black text-gray-300">৳</span>
            <input
              type="number"
              value={amount}
              onChange={e => { setAmount(e.target.value); setError(''); setInsufficientBalance(false); }}
              placeholder="0"
              className="flex-1 text-2xl font-extrabold text-gray-800 outline-none bg-transparent placeholder:text-gray-300"
            />
            <span className="text-sm font-bold text-gray-400 shrink-0">BDT</span>
          </div>
          {/* Quick amounts */}
          <div className="flex gap-2 mb-3">
            {[500, 1000, 2000, 5000].map(a => (
              <button key={a} onClick={() => setAmount(String(a))}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${amount === String(a)
                  ? 'text-white border-transparent'
                  : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                style={amount === String(a) ? { background: accentColor } : {}}>
                ৳{a}
              </button>
            ))}
          </div>
          {/* Conversion preview */}
          {convertedAmount && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden border border-emerald-100">
              {/* Receiver gets — highlighted */}
              <div className="bg-emerald-500 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-wider">প্রাপক পাবেন</p>
                  <p className="text-white font-black text-2xl mt-0.5">{convertedAmount} <span className="text-base">{country.currency_code}</span></p>
                </div>
                <span className="text-4xl">{country.flag_emoji}</span>
              </div>
              {/* Details */}
              <div className="bg-emerald-50 px-4 py-3 space-y-1.5">
               <div className="flex justify-between text-xs">
                 <span className="text-gray-500">Exchange Rate</span>
                 <span className="font-bold text-gray-700">1 ৳ = {country.exchange_rate} {country.currency_code}</span>
               </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">আপনি পাঠাচ্ছেন</span>
                  <span className="font-bold text-gray-700">৳{Number(amount).toLocaleString()} BDT</span>
                </div>
                {Number(feeAmount) > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Fee ({country.fee_percent}%)</span>
                    <span className="font-bold text-orange-500">৳{feeAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs border-t border-emerald-200 pt-1.5">
                  <span className="text-gray-700 font-bold">মোট কাটা হবে</span>
                  <span className="font-black text-gray-900">৳{totalDeduct.toLocaleString()} BDT</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Dynamic Receiver Fields */}
        {fields.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Receiver Information</p>
            {fields.map(f => (
              <div key={f.key}>
                <label className="text-xs font-bold text-gray-600 mb-1.5 block">{f.label}</label>
                <input
                  type={f.type || 'text'}
                  value={dynamicFields[f.key] || ''}
                  onChange={e => { setDynamicFields(prev => ({ ...prev, [f.key]: e.target.value })); setError(''); }}
                  placeholder={f.placeholder || `Enter ${f.label}`}
                  className="w-full border-b-2 border-gray-200 focus:border-emerald-500 py-2 text-sm font-semibold text-gray-800 outline-none bg-transparent placeholder:text-gray-300 transition-colors"
                />
              </div>
            ))}
          </div>
        )}

        {/* Insufficient Balance */}
        {insufficientBalance && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
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

        {error && <p className="text-red-500 text-xs font-semibold text-center">{error}</p>}

        <button onClick={handleSend}
          className="w-full text-white py-4 rounded-2xl font-black text-base shadow-lg active:scale-95 transition-transform"
          style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}>
          Send → {country.currency_code}
        </button>
      </div>

      {/* PIN Modal */}
      <AnimatePresence>
        {showPin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-end justify-center z-50">
            <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
              transition={{ type: 'spring', damping: 28 }}
              className="bg-white w-full max-w-[430px] rounded-t-3xl p-6 pb-10">
              <div className="mx-auto mb-4">
                <MethodLogo method={method} size={56} />
              </div>
              <h3 className="font-black text-lg text-center text-gray-800 mb-1">Confirm Transfer</h3>
              <p className="text-center text-gray-500 text-sm mb-1">{country.flag_emoji} {country.name} · {method.name}</p>
              <p className="text-center font-black text-xl mb-1" style={{ color: accentColor }}>
                ৳{totalDeduct.toLocaleString()} BDT
              </p>
              {convertedAmount && (
                <p className="text-center text-gray-400 text-xs mb-5">প্রাপক পাবেন: <span className="font-bold text-emerald-600">{convertedAmount} {country.currency_code}</span></p>
              )}
              <div className="mb-5">
                <p className="text-xs font-bold text-gray-500 mb-2 text-center">Enter Your PIN</p>
                <input
                  type="password"
                  value={pin}
                  onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(''); }}
                  placeholder="● ● ● ●"
                  autoFocus
                  disabled={pinBlocked}
                  className={`w-full text-center text-2xl tracking-[0.5em] border-2 ${pinError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'} rounded-2xl py-3.5 outline-none font-bold transition-colors`}
                />
                {pinError && (
                  <p className={`text-xs font-bold text-center mt-2 ${pinBlocked ? 'text-red-600' : 'text-red-500'}`}>
                    {pinBlocked ? '🔒 ' : '⚠️ '}{pinError}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowPin(false); setPin(''); setPinError(''); setPinBlocked(false); }}
                  className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 font-bold text-gray-600">Cancel</button>
                <button onClick={handleConfirm} disabled={loading || pin.length < 4 || pinBlocked}
                  className="flex-1 py-3.5 rounded-2xl font-black text-white disabled:opacity-40 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}>
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