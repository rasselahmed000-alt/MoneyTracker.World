import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Upload, AlertCircle, Plus } from 'lucide-react';
import UniversalHeader from '@/components/cellfin/UniversalHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function VisaApplication() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [appRef, setAppRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');
  const [visaServices, setVisaServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  const [form, setForm] = useState({
    full_name: '',
    passport_number: '',
    date_of_birth: '',
    nationality: '',
    gender: '',
    destination_country: '',
    visa_type: '',
    purpose_of_visit: '',
    passport_issue_date: '',
    passport_expiry_date: '',
    mobile_number: '',
    email_address: '',
    present_address: '',
    application_fee: 0,
  });

  const [docs, setDocs] = useState({
    passport_scan: null,
    national_id: null,
    bank_statement: null,
    passport_photo: null,
  });

  const [uploading, setUploading] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.auth.me(),
      base44.entities.VisaService.filter({ is_active: true }, 'sort_order', 100),
    ]).then(([u, services]) => {
      setUser(u);
      setForm(p => ({ ...p, email_address: u.email, full_name: u.full_name }));
      setVisaServices(services || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleDocUpload = async (docKey, file) => {
    setUploading(docKey);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setDocs(p => ({ ...p, [docKey]: file_url }));
    } catch {
      setError('Document upload failed');
    }
    setUploading(null);
  };

  const validate = () => {
    if (!form.full_name) return 'Enter full name';
    if (!form.passport_number) return 'Enter passport number';
    if (!form.date_of_birth) return 'Enter date of birth';
    if (!form.nationality) return 'Select nationality';
    if (!form.gender) return 'Select gender';
    if (!form.destination_country) return 'Select destination country';
    if (!form.visa_type) return 'Select visa type';
    if (!form.purpose_of_visit) return 'Enter purpose of visit';
    if (!form.passport_issue_date) return 'Enter passport issue date';
    if (!form.passport_expiry_date) return 'Enter passport expiry date';
    if (!form.mobile_number) return 'Enter mobile number';
    if (!form.present_address) return 'Enter address';
    if (!docs.passport_scan) return 'Upload passport scan';
    if (!docs.national_id) return 'Upload national ID/birth certificate';
    if (!docs.passport_photo) return 'Upload passport photo';
    return null;
  };

  const handleSubmit = async () => {
    setError('');
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setShowPin(true);
  };

  const handleConfirm = async () => {
    if (pin.length !== 4) return;
    setSubmitting(true);
    try {
      const pinRes = await base44.functions.invoke('verifyPin', { pin });
      if (!pinRes.data?.success) {
        setError(pinRes.data?.error || 'Invalid PIN');
        setSubmitting(false);
        return;
      }

      const ref = 'VA' + Date.now();
      const docVerification = {
        passport_scan: 'pending',
        national_id: 'pending',
        bank_statement: docs.bank_statement ? 'pending' : 'not_required',
        passport_photo: 'pending',
      };

      await base44.entities.VisaApplication.create({
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name,
        passport_number: form.passport_number,
        passport_scan_url: docs.passport_scan,
        destination_country: form.destination_country,
        visa_type: form.visa_type,
        purpose_of_visit: form.purpose_of_visit,
        date_of_birth: form.date_of_birth,
        nationality: form.nationality,
        gender: form.gender,
        passport_issue_date: form.passport_issue_date,
        passport_expiry_date: form.passport_expiry_date,
        mobile_number: form.mobile_number,
        email_address: form.email_address,
        present_address: form.present_address,
        national_id_url: docs.national_id,
        bank_statement_url: docs.bank_statement,
        passport_photo_url: docs.passport_photo,
        application_fee: form.application_fee,
        status: 'pending',
        app_ref: ref,
        doc_verification: docVerification,
        action_history: [{ action: 'submitted', by: user.email, timestamp: new Date().toISOString() }],
      });

      setAppRef(ref);
      setSubmitted(true);
    } catch (err) {
      setError(err?.message || 'Submission failed');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen bg-gradient-to-br from-blue-800 to-blue-600 flex flex-col items-center justify-center p-6 font-inter">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={56} className="text-white" />
          </div>
          <h2 className="text-white text-2xl font-extrabold mb-2">Application Submitted!</h2>
          <p className="text-white/80 text-sm mb-4">{form.destination_country} — {form.visa_type}</p>
          <div className="bg-white/20 rounded-2xl px-6 py-3 inline-block mb-6">
            <p className="text-white/60 text-xs">Reference</p>
            <p className="text-white font-extrabold text-xl tracking-widest">{appRef}</p>
          </div>
          <p className="text-white/70 text-xs mb-6">আমাদের টিম ২৪ ঘণ্টার মধ্যে যোগাযোগ করবে। আপনার প্রোফাইলে স্ট্যাটাস চেক করুন।</p>
          <button onClick={() => navigate('/')} className="bg-white text-blue-700 px-8 py-3.5 rounded-2xl font-bold">
            Back Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-gray-50 font-inter">
      {/* Universal Header */}
      <UniversalHeader
        title="Visa Application"
        subtitle="Secure • Simple • Fast"
        gradient="linear-gradient(135deg, #1e40af 0%, #2563eb 100%)"
      />

      <div className="px-4 pt-20 pb-5 space-y-4 pb-20" style={{ paddingTop: 'calc(4.5rem + env(safe-area-inset-top))' }}>
        {/* Basic Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">👤 Basic Information</p>
          <input type="text" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
            placeholder="Full name as in passport" className="w-full border-2 border-gray-100 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors" />
          <input type="text" value={form.passport_number} onChange={e => setForm(p => ({ ...p, passport_number: e.target.value }))}
            placeholder="Passport number" className="w-full border-2 border-gray-100 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors" />
          <input type="date" value={form.date_of_birth} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))}
            className="w-full border-2 border-gray-100 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors" />
          <input type="text" value={form.nationality} onChange={e => setForm(p => ({ ...p, nationality: e.target.value }))}
            placeholder="Nationality" className="w-full border-2 border-gray-100 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors" />
          <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
            className="w-full border-2 border-gray-100 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors">
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Travel Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">✈️ Travel Information</p>
          <select value={form.destination_country}
            onChange={e => {
              const svc = visaServices.find(s => `${s.flag || ''} ${s.country_name}`.trim() === e.target.value || s.country_name === e.target.value);
              setSelectedService(svc || null);
              setForm(p => ({ ...p, destination_country: e.target.value, visa_type: '', application_fee: svc ? (svc.visa_fee || 0) + (svc.service_charge || 0) + (svc.processing_charge || 0) : 0 }));
            }}
            className="w-full border-2 border-gray-100 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors">
            <option value="">Select destination country</option>
            {visaServices.map(s => (
              <option key={s.id} value={`${s.flag || ''} ${s.country_name}`.trim()}>{s.flag} {s.country_name}</option>
            ))}
          </select>
          <select value={form.visa_type} onChange={e => setForm(p => ({ ...p, visa_type: e.target.value }))}
            className="w-full border-2 border-gray-100 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors">
            <option value="">Select visa type</option>
            {(selectedService?.visa_types?.length ? selectedService.visa_types : ['Tourist', 'Business', 'Student', 'Work']).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {selectedService && (
            <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 font-medium space-y-1">
              <p>💰 Fee: ৳{((selectedService.visa_fee || 0) + (selectedService.service_charge || 0) + (selectedService.processing_charge || 0)).toLocaleString()} BDT</p>
              {selectedService.processing_time && <p>⏱ Processing: {selectedService.processing_time}</p>}
              {selectedService.description && <p className="text-blue-500">{selectedService.description}</p>}
            </div>
          )}
          <textarea value={form.purpose_of_visit} onChange={e => setForm(p => ({ ...p, purpose_of_visit: e.target.value }))}
            placeholder="Purpose of visit" rows={2} className="w-full border-2 border-gray-100 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors resize-none" />
        </div>

        {/* Passport Details */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">🛂 Passport Details</p>
          <input type="date" value={form.passport_issue_date} onChange={e => setForm(p => ({ ...p, passport_issue_date: e.target.value }))}
            placeholder="Issue date" className="w-full border-2 border-gray-100 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors" />
          <input type="date" value={form.passport_expiry_date} onChange={e => setForm(p => ({ ...p, passport_expiry_date: e.target.value }))}
            placeholder="Expiry date" className="w-full border-2 border-gray-100 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors" />
          <label className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${docs.passport_scan ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 bg-white hover:border-blue-300'}`}>
            {uploading === 'passport_scan' ? <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <Upload size={14} />}
            <span className="text-xs font-bold flex-1">{docs.passport_scan ? '✓ Passport Scan' : 'Upload Passport Scan'}</span>
            <input type="file" accept=".pdf,.jpg,.jpeg" onChange={e => e.target.files?.[0] && handleDocUpload('passport_scan', e.target.files[0])} className="hidden" />
          </label>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">📞 Contact Information</p>
          <input type="tel" value={form.mobile_number} onChange={e => setForm(p => ({ ...p, mobile_number: e.target.value }))}
            placeholder="Mobile number" className="w-full border-2 border-gray-100 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors" />
          <input type="email" value={form.email_address} onChange={e => setForm(p => ({ ...p, email_address: e.target.value }))}
            placeholder="Email" className="w-full border-2 border-gray-100 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors" readOnly />
          <textarea value={form.present_address} onChange={e => setForm(p => ({ ...p, present_address: e.target.value }))}
            placeholder="Present address" rows={2} className="w-full border-2 border-gray-100 focus:border-blue-500 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors resize-none" />
        </div>

        {/* Supporting Documents */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">📄 Supporting Documents</p>
          <label className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${docs.national_id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 bg-white hover:border-blue-300'}`}>
            {uploading === 'national_id' ? <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <Upload size={14} />}
            <span className="text-xs font-bold flex-1">{docs.national_id ? '✓ National ID/Birth Cert' : 'National ID / Birth Certificate'}</span>
            <input type="file" accept=".pdf,.jpg,.jpeg" onChange={e => e.target.files?.[0] && handleDocUpload('national_id', e.target.files[0])} className="hidden" />
          </label>
          <label className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${docs.bank_statement ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 bg-white hover:border-blue-300'}`}>
            {uploading === 'bank_statement' ? <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <Upload size={14} />}
            <span className="text-xs font-bold flex-1">{docs.bank_statement ? '✓ Bank Statement' : 'Bank Statement (Optional)'}</span>
            <input type="file" accept=".pdf,.jpg,.jpeg" onChange={e => e.target.files?.[0] && handleDocUpload('bank_statement', e.target.files[0])} className="hidden" />
          </label>
          <label className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${docs.passport_photo ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 bg-white hover:border-blue-300'}`}>
            {uploading === 'passport_photo' ? <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <Upload size={14} />}
            <span className="text-xs font-bold flex-1">{docs.passport_photo ? '✓ Passport Photo' : 'Passport Size Photo'}</span>
            <input type="file" accept=".jpg,.jpeg,.png" onChange={e => e.target.files?.[0] && handleDocUpload('passport_photo', e.target.files[0])} className="hidden" />
          </label>
        </div>

        {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-xl">{error}</p>}

        <button onClick={handleSubmit} disabled={submitting}
          className="w-full bg-blue-700 text-white py-4 rounded-2xl font-extrabold shadow-lg active:scale-95 transition-transform disabled:opacity-60">
          Submit Application →
        </button>

        <p className="text-center text-xs text-gray-400 pb-6">All fields are required</p>
      </div>

      {/* PIN Modal */}
      <AnimatePresence>
        {showPin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-end justify-center z-50">
            <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} transition={{ type: 'spring', damping: 28 }}
              className="bg-white w-full max-w-[430px] rounded-t-3xl p-6 pb-10">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">🛂</div>
              <h3 className="font-extrabold text-lg text-center text-gray-800 mb-1">Confirm Submission</h3>
              <p className="text-center text-gray-500 text-sm mb-5">{form.destination_country} — {form.visa_type}</p>
              <div className="mb-5">
                <p className="text-xs font-bold text-gray-500 mb-2 text-center">Enter Your PIN</p>
                <input type="password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="● ● ● ●" autoFocus
                  className="w-full text-center text-2xl tracking-[0.5em] border-2 border-gray-200 focus:border-blue-500 rounded-2xl py-3.5 outline-none bg-gray-50 font-bold transition-colors" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowPin(false); setPin(''); }}
                  className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 font-bold text-gray-600">Cancel</button>
                <button onClick={handleConfirm} disabled={submitting || pin.length !== 4}
                  className="flex-1 bg-blue-700 text-white py-3.5 rounded-2xl font-extrabold disabled:opacity-40 shadow-lg">
                  {submitting ? 'Processing...' : 'Submit'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}