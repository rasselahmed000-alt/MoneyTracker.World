import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Check, Upload, Smartphone, Building2, ChevronRight, CheckCircle2, ImagePlus, RefreshCw, X } from 'lucide-react';
import UniversalHeader from '@/components/cellfin/UniversalHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import AppShell from '../components/cellfin/AppShell';

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="font-bold text-gray-800 text-sm mt-0.5 break-all">{value}</p>
      </div>
      <button onClick={copy}
        className={`shrink-0 p-2 rounded-xl transition-all ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-white border border-gray-200 text-gray-400 hover:border-forest hover:text-forest'}`}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
}

export default function ManualDeposit() {
  const navigate = useNavigate();
  const [step, setStep] = useState('country'); // country → method → details
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const [amountSent, setAmountSent] = useState('');
  const [txRef, setTxRef] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState(''); // local blob preview before upload
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    loadCountries();
  }, []);

  const loadCountries = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.ManualDepositAccount.filter({ is_active: true }, 'sort_order', 300);
      // Get unique countries with their rates
      const seen = {};
      const list = [];
      all.forEach(acc => {
        if (!seen[acc.country]) {
          seen[acc.country] = true;
          list.push({
            country: acc.country,
            currency: acc.currency,
            currency_code: acc.currency_code,
            flag_emoji: acc.flag_emoji || '🌍',
            exchange_rate: acc.exchange_rate || 1,
            send_limit: acc.send_limit || 0,
            receive_limit: acc.receive_limit || 0,
            sort_order: acc.sort_order || 0,
          });
        }
      });
      setCountries(list.sort((a, b) => a.sort_order - b.sort_order));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCountrySelect = async (c) => {
    setSelectedCountry(c);
    setSelectedMethod(null);
    setLoadingAccounts(true);
    try {
      const data = await base44.entities.ManualDepositAccount.filter({ country: c.country, is_active: true }, 'sort_order', 50);
      setAccounts(data || []);
    } catch (e) {
      setAccounts([]);
    }
    setLoadingAccounts(false);
    setStep('method');
  };

  const handleMethodSelect = (acc) => {
    setSelectedMethod(acc);
    setStep('details');
  };

  const bdtAmount = amountSent && selectedCountry
    ? Math.round(parseFloat(amountSent) * (selectedCountry.exchange_rate || 1))
    : 0;

  const isMobile = selectedMethod?.method === 'mobile_banking';

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');

    // Validate image type
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadError('শুধুমাত্র JPG, JPEG, PNG, WEBP ফাইল আপলোড করুন');
      return;
    }
    // Validate minimum size (at least 10KB to reject corrupt/blank images)
    if (file.size < 10 * 1024) {
      setUploadError('ছবিটি খুব ছোট বা corrupted। একটি স্পষ্ট receipt ছবি নির্বাচন করুন।');
      return;
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setReceiptUrl(''); // clear previous upload url

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setReceiptUrl(file_url);
    } catch (err) {
      setUploadError('আপলোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      setPreviewUrl('');
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!amountSent || parseFloat(amountSent) <= 0 || !txRef || txRef.length < 2) return;
    if (!isMobile && !receiptUrl) return;
    setSubmitting(true);
    try {
      const txId = `MDR-${Date.now()}`;
      // Create the deposit request
      const depositReq = await base44.entities.ManualDepositRequest.create({
        user_id: user?.id,
        user_email: user?.email,
        user_name: user?.full_name,
        country: selectedCountry?.country,
        currency: selectedCountry?.currency_code,
        method: selectedMethod?.method,
        amount_sent: parseFloat(amountSent),
        bdt_amount: bdtAmount,
        last_digits: txRef,
        receipt_url: receiptUrl,
        status: 'pending',
      });
      // Immediately create a pending Transaction entry for history
      await base44.entities.Transaction.create({
        user_id: user?.id,
        user_email: user?.email,
        type: 'deposit',
        amount: bdtAmount,
        currency: 'BDT',
        status: 'pending',
        tx_id: txId,
        description: `Manual Deposit — ${selectedCountry?.country} (${parseFloat(amountSent)} ${selectedCountry?.currency_code})`,
        deposit_request_id: depositReq?.id || '',
      });
      setSubmitted(true);
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const goBack = () => {
    if (step === 'country') navigate(-1);
    else if (step === 'method') setStep('country');
    else setStep('method');
  };

  const stepLabels = { country: 'Select Country', method: 'Select Account', details: 'Transfer Details' };

  // ── Success Screen ──
  if (submitted) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen bg-gradient-to-br from-forest to-emerald-700 flex flex-col items-center justify-center p-6 font-inter">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center w-full">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={48} className="text-white" />
          </div>
          <h2 className="text-white text-2xl font-extrabold mb-2">Request Submitted!</h2>
          <p className="text-white/70 text-sm mb-6">আপনার ডিপোজিট রিকোয়েস্ট জমা হয়েছে। Money Tracker-এর approval-এর পর ব্যালেন্স যোগ হবে।</p>
          <div className="bg-white/15 rounded-2xl p-4 mb-6 space-y-2 text-left">
            {[
              ['Country', `${selectedCountry?.flag_emoji} ${selectedCountry?.country}`],
              ['Amount', `${amountSent} ${selectedCountry?.currency_code}`],
              ['BDT Equivalent', `≈ ৳${bdtAmount.toLocaleString()}`],
              ['Rate Used', `1 ${selectedCountry?.currency_code} = ৳${selectedCountry?.exchange_rate}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-white/60">{k}</span>
                <span className="text-white font-bold">{v}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/')} className="w-full bg-white text-forest py-3.5 rounded-2xl font-extrabold">
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <AppShell header={
      <UniversalHeader
        title="Manual Deposit"
        subtitle={stepLabels[step]}
        onBack={goBack}
      />
    }>
      <div className="px-4 py-5">
        <AnimatePresence mode="wait">

          {/* STEP 1: Country Selection */}
          {step === 'country' && (
            <motion.div key="country" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">কোন দেশ থেকে পাঠাচ্ছেন?</p>
              {loading ? (
                <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}</div>
              ) : countries.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                  <p className="text-2xl mb-2">⚠️</p>
                  <p className="font-bold text-amber-700">কোনো দেশ এখনো configure করা হয়নি</p>
                  <p className="text-amber-600 text-xs mt-1">Money Tracker Panel থেকে দেশ যোগ করুন</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {countries.map((c, i) => (
                    <motion.button key={c.country} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      onClick={() => handleCountrySelect(c)}
                      className="w-full bg-white rounded-2xl p-4 shadow-sm border-2 border-gray-100 hover:border-forest/30 active:scale-98 transition-all flex items-center gap-3 text-left">
                      <span className="text-3xl shrink-0">{c.flag_emoji}</span>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-sm">{c.country}</p>
                        <p className="text-xs text-gray-400">{c.currency} ({c.currency_code})</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-emerald-600">1 {c.currency_code}</p>
                        <p className="text-sm font-black text-gray-800">= ৳{c.exchange_rate}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300" />
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: Account/Method Selection */}
          {step === 'method' && (
            <motion.div key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              {/* Rate banner */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 flex items-center gap-3">
                <span className="text-2xl">{selectedCountry?.flag_emoji}</span>
                <div>
                  <p className="text-xs text-emerald-600 font-bold">Current Rate</p>
                  <p className="font-black text-emerald-700">1 {selectedCountry?.currency_code} = ৳{selectedCountry?.exchange_rate}</p>
                </div>
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">কোন অ্যাকাউন্টে পাঠাবেন?</p>
              {loadingAccounts ? (
                <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}</div>
              ) : accounts.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                  <p className="text-2xl mb-2">⚠️</p>
                  <p className="font-bold text-amber-700 text-sm">কোনো অ্যাকাউন্ট পাওয়া যায়নি</p>
                  <p className="text-amber-600 text-xs mt-1">Money Tracker-এর সাথে যোগাযোগ করুন</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {accounts.map((acc, i) => (
                    <motion.button key={acc.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      onClick={() => handleMethodSelect(acc)}
                      className="w-full rounded-2xl p-4 shadow-sm border-2 border-gray-100 hover:border-forest/30 active:scale-98 transition-all bg-white text-left">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${acc.method === 'mobile_banking' ? 'bg-pink-50' : 'bg-blue-50'}`}>
                          {acc.method === 'mobile_banking' ? <Smartphone size={18} className="text-pink-500" /> : <Building2 size={18} className="text-blue-500" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
                            {acc.method === 'mobile_banking' ? acc.mobile_provider : acc.bank_name}
                          </p>
                          <p className="font-bold text-gray-800 text-sm">
                            {acc.method === 'mobile_banking' ? acc.mobile_number : acc.account_number}
                          </p>
                          {acc.account_holder && <p className="text-xs text-gray-400">{acc.account_holder}</p>}
                        </div>
                        <ChevronRight size={16} className="text-gray-300" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: Details & Submit */}
          {step === 'details' && selectedMethod && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">

              {/* Account Info */}
              <div className={`rounded-3xl overflow-hidden shadow-md border-2 ${isMobile ? 'border-pink-100' : 'border-blue-100'}`}>
                <div className={`px-4 py-3 flex items-center gap-2.5 ${isMobile ? 'bg-gradient-to-r from-pink-500 to-rose-600' : 'bg-gradient-to-r from-blue-600 to-indigo-700'}`}>
                  {isMobile ? <Smartphone size={15} className="text-white" /> : <Building2 size={15} className="text-white" />}
                  <p className="text-white font-extrabold text-sm">
                    {isMobile ? `${selectedMethod.mobile_provider} — Send Money` : 'Bank Transfer Details'}
                  </p>
                </div>
                <div className="bg-white p-4 space-y-3">
                  {isMobile ? (
                    <>
                      {selectedMethod.mobile_provider && <CopyField label="Provider" value={selectedMethod.mobile_provider} />}
                      {selectedMethod.mobile_number && <CopyField label="Mobile Number" value={selectedMethod.mobile_number} />}
                      {selectedMethod.account_holder && <CopyField label="Account Holder" value={selectedMethod.account_holder} />}
                    </>
                  ) : (
                    <>
                      {selectedMethod.bank_name && <CopyField label="Bank Name" value={selectedMethod.bank_name} />}
                      {selectedMethod.account_holder && <CopyField label="Account Holder" value={selectedMethod.account_holder} />}
                      {selectedMethod.account_number && <CopyField label="Account Number" value={selectedMethod.account_number} />}
                      {selectedMethod.iban && <CopyField label="IBAN" value={selectedMethod.iban} />}
                      {selectedMethod.swift_code && <CopyField label="SWIFT Code" value={selectedMethod.swift_code} />}
                      {selectedMethod.branch && <CopyField label="Branch" value={selectedMethod.branch} />}
                    </>
                  )}
                </div>
              </div>

              {/* Amount Input with Live Conversion */}
              <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-forest to-emerald-700 px-4 py-3 flex items-center gap-2">
                  <span className="text-lg">{selectedCountry?.flag_emoji}</span>
                  <p className="text-white font-extrabold text-sm">কত {selectedCountry?.currency_code} পাঠিয়েছেন?</p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3.5 border-2 border-gray-100 focus-within:border-forest transition-colors">
                    <span className="text-2xl shrink-0">{selectedCountry?.flag_emoji}</span>
                    <input type="number" value={amountSent} onChange={e => setAmountSent(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 text-xl font-extrabold text-gray-800 outline-none bg-transparent" />
                    <span className="text-sm font-extrabold text-gray-600 shrink-0">{selectedCountry?.currency_code}</span>
                  </div>
                  <AnimatePresence>
                    {bdtAmount > 0 && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
                        <p className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">You will receive (BDT)</p>
                        <p className="text-2xl font-black text-emerald-700 mt-1">৳{bdtAmount.toLocaleString()}</p>
                        <p className="text-[10px] text-emerald-500 mt-0.5">Rate: 1 {selectedCountry?.currency_code} = ৳{selectedCountry?.exchange_rate}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Transaction Reference */}
              <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-4">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider block mb-3">
                  {isMobile ? 'Transaction ID (Last 4 digits)' : 'Reference / UTR Number'}
                </label>
                <input type="text" value={txRef}
                  onChange={e => setTxRef(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20))}
                  placeholder={isMobile ? '● ● ● ●' : 'UTR or Reference ID'}
                  className="w-full border-2 border-gray-100 focus:border-forest rounded-2xl px-4 py-3.5 text-sm font-bold outline-none transition-colors" />
                <p className="text-[10px] text-gray-400 mt-2">
                  {isMobile ? 'Transaction ID-র শেষ ৪টি ডিজিট লিখুন' : 'Bank/Payment reference number লিখুন'}
                </p>
              </div>

              {/* Receipt Upload (bank only) */}
              {!isMobile && (
                <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-4 py-3 flex items-center gap-2">
                    <ImagePlus size={15} className="text-white" />
                    <p className="text-white font-extrabold text-sm">Upload Receipt / Proof</p>
                    <span className="ml-auto text-white/60 text-[10px] font-bold">(Required)</span>
                  </div>
                  <div className="p-4">
                    <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={handleFileUpload} className="hidden" />

                    {/* Preview (local or uploaded) */}
                    {(previewUrl || receiptUrl) ? (
                      <div className="space-y-3">
                        <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-200">
                          <img src={previewUrl || receiptUrl} alt="Receipt Preview"
                            className="w-full object-contain max-h-72 bg-gray-50" style={{ imageRendering: 'crisp-edges' }} />
                          {/* Status overlay */}
                          <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${receiptUrl ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-white'}`}>
                            {uploading
                              ? <><span className="w-2.5 h-2.5 border border-white/40 border-t-white rounded-full animate-spin" /> Uploading...</>
                              : receiptUrl
                                ? <><Check size={10} /> Uploaded</>
                                : <><span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Processing...</>
                            }
                          </div>
                        </div>
                        {uploadError && (
                          <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-xl">{uploadError}</p>
                        )}
                        <button onClick={() => { setReceiptUrl(''); setPreviewUrl(''); setUploadError(''); setTimeout(() => fileRef.current?.click(), 100); }}
                          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-violet-300 text-violet-600 font-bold text-sm py-3 rounded-2xl">
                          <RefreshCw size={15} /> Re-upload
                        </button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => fileRef.current?.click()} disabled={uploading}
                          className="w-full border-2 border-dashed border-gray-200 hover:border-violet-400 rounded-2xl py-10 flex flex-col items-center gap-3 transition-colors">
                          <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center">
                            <ImagePlus size={26} className="text-violet-500" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-extrabold text-gray-700">Choose receipt image</p>
                            <p className="text-xs text-gray-400 mt-0.5">JPG, JPEG, PNG, WEBP</p>
                          </div>
                        </button>
                        {uploadError && (
                          <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-xl mt-3">{uploadError}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Submit */}
              <button onClick={handleSubmit}
                disabled={submitting || !amountSent || parseFloat(amountSent) <= 0 || !txRef || txRef.length < 2 || (!isMobile && !receiptUrl) || uploading}
                className="w-full bg-gradient-to-r from-forest to-emerald-700 text-gold py-4 rounded-2xl font-extrabold text-base shadow-lg active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center gap-2">
                {submitting
                  ? <><span className="w-5 h-5 border-2 border-gold/40 border-t-gold rounded-full animate-spin" /> Submitting...</>
                  : <><CheckCircle2 size={18} /> Submit Deposit Request</>
                }
              </button>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5">
                <span className="text-amber-500 mt-0.5">⏱</span>
                <p className="text-amber-700 text-xs leading-relaxed">Money Tracker review সাধারণত ১–২৪ ঘণ্টার মধ্যে সম্পন্ন হয়। Approval-এর পর balance স্বয়ংক্রিয়ভাবে যোগ হবে।</p>
              </div>
              <div className="h-6" />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </AppShell>
  );
}