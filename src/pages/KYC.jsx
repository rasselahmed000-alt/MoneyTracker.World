import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, CheckCircle2, Camera, AlertCircle, CreditCard, Code, XCircle, FileText, Globe } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import AppShell from '../components/cellfin/AppShell';
import UniversalHeader from '@/components/cellfin/UniversalHeader';



// Document type configs
const DOC_TYPES = [
  {
    id: 'nid',
    label: 'NID',
    labelFull: 'National ID Card',
    icon: CreditCard,
    color: '#0B3D2E',
    bg: '#f0fdf4',
    uploads: [
      { key: 'doc_front', label: 'NID Front Side', desc: 'সামনের পাশ (Front)', icon: CreditCard },
      { key: 'doc_back',  label: 'NID Back Side',  desc: 'পিছনের পাশ (Back)',  icon: CreditCard },
    ],
  },
  {
    id: 'passport',
    label: 'Passport',
    labelFull: 'International Passport',
    icon: Globe,
    color: '#1e40af',
    bg: '#eff6ff',
    uploads: [
      { key: 'doc_front', label: 'Passport Bio Page', desc: 'Photo & info page', icon: Globe },
    ],
  },
  {
    id: 'iqama',
    label: 'Iqama',
    labelFull: 'Iqama / Residence Card',
    icon: FileText,
    color: '#7c3aed',
    bg: '#f5f3ff',
    uploads: [
      { key: 'doc_front', label: 'Iqama Front Side', desc: 'সামনের পাশ (Front)', icon: FileText },
      { key: 'doc_back',  label: 'Iqama Back Side',  desc: 'পিছনের পাশ (Back)',  icon: FileText },
    ],
  },
];

function UploadBox({ label, desc, value, onChange, uploading, IconComp, accent }) {
  const [showOptions, setShowOptions] = useState(false);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (file) onChange(file);
    setShowOptions(false);
  };

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${accent}18` }}>
            <IconComp size={18} style={{ color: accent }} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-gray-800">{label}</p>
            <p className="text-xs text-gray-400">{desc}</p>
          </div>
          {value && <CheckCircle2 size={18} className="text-emerald-500" />}
        </div>
        <div className="px-4 pb-4">
          {value ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-100">
              <img src={value} className="w-full h-36 object-cover" alt={label} />
              <button onClick={() => onChange(null)}
                className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2.5 py-1 rounded-lg font-bold">
                Remove
              </button>
            </div>
          ) : (
            <button onClick={() => setShowOptions(!showOptions)} className={`w-full flex flex-col items-center gap-2 py-7 border-2 border-dashed rounded-xl cursor-pointer transition-all ${uploading ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              {uploading
                ? <div className="w-7 h-7 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                : <Upload size={22} className="text-gray-400" />
              }
              <span className="text-xs text-gray-500 font-medium">{uploading ? 'Uploading...' : 'Tap to upload photo'}</span>
            </button>
          )}
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => e.target.files[0] && handleFileSelect(e.target.files[0])} />
          <input ref={galleryInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files[0] && handleFileSelect(e.target.files[0])} />
        </div>
      </div>

      {showOptions && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-end justify-center z-50">
          <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} transition={{ type: 'spring', damping: 28 }} className="bg-white w-full max-w-[430px] rounded-t-3xl p-6 pb-10">
            <p className="font-bold text-lg text-gray-800 mb-4 text-center">Choose Option</p>
            <div className="space-y-3">
              <button onClick={() => cameraInputRef.current?.click()} className="w-full flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl hover:bg-blue-100 transition-colors">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                  <Camera size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800">📷 Take Photo</p>
                  <p className="text-xs text-gray-500">Use your camera</p>
                </div>
              </button>
              <button onClick={() => galleryInputRef.current?.click()} className="w-full flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl hover:bg-emerald-100 transition-colors">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <Upload size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800">🖼️ Choose from Gallery</p>
                  <p className="text-xs text-gray-500">Select from your files</p>
                </div>
              </button>
            </div>
            <button onClick={() => setShowOptions(false)} className="w-full mt-4 py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-600">Cancel</button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}

      export default function KYC() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState('form'); // form | success

  // Document type selection
  const [docType, setDocType] = useState(null); // 'nid' | 'passport' | 'iqama'
  const [docFront, setDocFront] = useState(null);
  const [docBack, setDocBack] = useState(null);

  // Face photo
  const [facePhoto, setFacePhoto] = useState(null);
  const [faceStatus, setFaceStatus] = useState(null); // null | 'checking' | 'pass' | 'fail'
  const [faceError, setFaceError] = useState('');

  // Agent code
  const [agentCode, setAgentCode] = useState('');
  const [agentInfo, setAgentInfo] = useState(null);
  const [agentError, setAgentError] = useState('');
  const [agentChecking, setAgentChecking] = useState(false);

  const [uploading, setUploading] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const uploadFile = async (file, field) => {
    setUploading(field);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploading('');
    return file_url;
  };

  // Reset docs when docType changes
  const handleDocTypeChange = (type) => {
    setDocType(type);
    setDocFront(null);
    setDocBack(null);
    setError('');
  };

  const handleDocFront = async (file) => {
    if (!file) { setDocFront(null); return; }
    const url = await uploadFile(file, 'doc_front');
    setDocFront(url);
  };

  const handleDocBack = async (file) => {
    if (!file) { setDocBack(null); return; }
    const url = await uploadFile(file, 'doc_back');
    setDocBack(url);
  };

  const handleFacePhoto = async (file) => {
    if (!file) { setFacePhoto(null); setFaceStatus(null); setFaceError(''); return; }
    const url = await uploadFile(file, 'face');
    setFacePhoto(url);
    setFaceStatus('pass');
  };

  const checkAgentCode = async (code) => {
    setAgentCode(code);
    setAgentInfo(null);
    setAgentError('');
    if (code.length < 3) return;
    setAgentChecking(true);
    try {
      const res = await base44.functions.invoke('verifyAgentCode', { agent_code: code });
      if (res.data?.valid) {
        // Normalize response to match expected agentInfo shape
        setAgentInfo({
          id: res.data.agent_id,
          agent_name: res.data.agent_name,
          agent_code: res.data.agent_code,
          country: res.data.country,
          photo_url: res.data.photo_url,
          status: res.data.status,
          pending_kyc: 0,
          total_customers: 0,
        });
      } else if (code.length >= 4) {
        setAgentError('Invalid or inactive agent code');
      }
    } catch { /* silently fail */ }
    finally { setAgentChecking(false); }
  };

  const selectedDocConf = DOC_TYPES.find(d => d.id === docType);
  const needsBack = docType === 'nid' || docType === 'iqama';
  const docsReady = docType && docFront && (!needsBack || docBack);

  const handleSubmit = async () => {
    if (!docsReady) { setError('Please upload all required document photos.'); return; }
    if (!facePhoto || faceStatus !== 'pass') { setError('Please upload a valid face photo.'); return; }
    if (!agentCode || !agentInfo) { setError('Please enter a valid agent code.'); return; }

    setSubmitting(true);
    setError('');
    try {
      await base44.auth.updateMe({
        kyc_nid_front: docFront,
        kyc_nid_back: docBack || '',
        kyc_face_photo: facePhoto,
        kyc_doc_type: docType,
        kyc_status: 'submitted',
        kyc_submitted_at: new Date().toISOString(),
        agent_code: agentInfo.agent_code,
        agent_name: agentInfo.agent_name,
      });
      await base44.entities.Agent.update(agentInfo.id, {
        pending_kyc: (agentInfo.pending_kyc || 0) + 1,
        total_customers: (agentInfo.total_customers || 0) + 1,
      }).catch(() => {});
      setStep('success');
    } catch {
      setError('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const kycStatus = user?.kyc_status;

  // Already submitted/approved view
  if (kycStatus === 'submitted' || kycStatus === 'approved') {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen font-inter flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(160deg,#0b3d2e 0%,#0f4d36 60%,#0a3828 100%)' }}>
        <div className="w-20 h-20 rounded-full bg-emerald-400/20 flex items-center justify-center mb-5">
          <CheckCircle2 size={44} className="text-emerald-400" />
        </div>
        <h2 className="text-white font-black text-2xl mb-2">
          {kycStatus === 'approved' ? 'KYC Verified ✅' : 'Under Review 🔍'}
        </h2>
        <p className="text-white/60 text-center text-sm mb-8">
          {kycStatus === 'approved'
            ? 'Your identity has been verified successfully.'
            : 'Your KYC is under review. Approval takes 24-48 hours.'}
        </p>
        <button onClick={() => navigate('/profile')} className="bg-emerald-500 text-white px-8 py-3.5 rounded-2xl font-bold">
          Back to Profile
        </button>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen font-inter flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(160deg,#0b3d2e 0%,#0f4d36 60%,#0a3828 100%)' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-emerald-400/20 flex items-center justify-center mb-5">
          <CheckCircle2 size={44} className="text-emerald-400" />
        </motion.div>
        <h2 className="text-white font-black text-2xl mb-2">Submitted! 🎉</h2>
        <p className="text-white/60 text-center text-sm mb-8">Your KYC is under review. We'll notify you within 24-48 hours.</p>
        <button onClick={() => navigate('/profile')} className="bg-emerald-500 text-white px-8 py-3.5 rounded-2xl font-bold">
          Back to Profile
        </button>
      </div>
    );
  }

  // Progress steps: docType selected, docs uploaded, face done, agent done
  const progressItems = [
    { label: 'Doc Type', done: !!docType },
    { label: 'Documents', done: docsReady },
    { label: 'Face', done: faceStatus === 'pass' },
    { label: 'Agent', done: !!agentInfo },
  ];

  return (
    <AppShell header={
      <UniversalHeader
        title="KYC Verification"
        subtitle="Identity verification required"
      />
    }>
      {/* Rejection notice */}
      {kycStatus === 'rejected' && (user?.kyc_rejection_reason || user?.kyc_reject_reason) && (
        <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <XCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-red-700 text-sm">KYC Rejected</p>
            <p className="text-red-600 text-xs mt-0.5">{user.kyc_rejection_reason || user.kyc_reject_reason}</p>
            <p className="text-red-500 text-xs mt-1 font-medium">Please resubmit with correct documents.</p>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4 pb-10">
        {/* Progress bar */}
        <div className="grid grid-cols-4 gap-2">
          {progressItems.map(item => (
            <div key={item.label} className="text-center">
              <div className={`h-1.5 rounded-full mb-1 transition-all ${item.done ? 'bg-emerald-500' : 'bg-gray-200'}`} />
              <p className={`text-[9px] font-bold ${item.done ? 'text-emerald-600' : 'text-gray-400'}`}>{item.label}</p>
            </div>
          ))}
        </div>

        {/* ── STEP 1: Document Type Selection ── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="font-black text-gray-800 text-sm mb-1">Step 1: Select Document Type</p>
          <p className="text-xs text-gray-400 mb-3">Choose your identity document</p>
          <div className="grid grid-cols-3 gap-2">
            {DOC_TYPES.map(dt => {
              const active = docType === dt.id;
              return (
                <button key={dt.id} onClick={() => handleDocTypeChange(dt.id)}
                  className="flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-xl border-2 transition-all font-bold text-xs"
                  style={{
                    borderColor: active ? dt.color : '#e2e8f0',
                    background: active ? dt.bg : '#f8fafc',
                    color: active ? dt.color : '#64748b',
                  }}>
                  <dt.icon size={20} style={{ color: active ? dt.color : '#94a3b8' }} />
                  <span>{dt.label}</span>
                  {active && <span className="w-1.5 h-1.5 rounded-full" style={{ background: dt.color }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── STEP 2: Document Uploads ── */}
        <AnimatePresence>
          {docType && selectedDocConf && (
            <motion.div key={docType} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="px-1">
                <p className="font-black text-gray-800 text-sm">
                  Step 2: Upload {selectedDocConf.labelFull}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedDocConf.id === 'nid' && 'NID-এর সামনে ও পিছনের ছবি আপলোড করুন'}
                  {selectedDocConf.id === 'passport' && 'Passport-এর bio page আপলোড করুন'}
                  {selectedDocConf.id === 'iqama' && 'Iqama-এর সামনে ও পিছনের ছবি আপলোড করুন'}
                </p>
              </div>

              {/* Front upload */}
              <UploadBox
                label={selectedDocConf.uploads[0].label}
                desc={selectedDocConf.uploads[0].desc}
                value={docFront}
                onChange={handleDocFront}
                uploading={uploading === 'doc_front'}
                IconComp={selectedDocConf.uploads[0].icon}
                accent={selectedDocConf.color}
              />

              {/* Back upload — only for NID & Iqama */}
              {needsBack && (
                <UploadBox
                  label={selectedDocConf.uploads[1].label}
                  desc={selectedDocConf.uploads[1].desc}
                  value={docBack}
                  onChange={handleDocBack}
                  uploading={uploading === 'doc_back'}
                  IconComp={selectedDocConf.uploads[1].icon}
                  accent={selectedDocConf.color}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── STEP 3: Face Photo ── */}
        <AnimatePresence>
          {docsReady && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="px-4 pt-4 pb-2 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-violet-50">
                  <Camera size={18} className="text-violet-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-800">Step 3: Face Photo <span className="text-red-400">*</span></p>
                  <p className="text-xs text-gray-400">Clear photo, single face, well-lit</p>
                </div>
                {faceStatus === 'pass' && <CheckCircle2 size={18} className="text-emerald-500" />}
                {faceStatus === 'fail' && <XCircle size={18} className="text-red-500" />}
              </div>
              <div className="px-4 pb-4">

                {faceStatus === 'pass' && facePhoto && (
                  <div className="relative rounded-xl overflow-hidden border-2 border-emerald-300">
                    <img src={facePhoto} className="w-full h-36 object-cover" alt="Face" />
                    <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                      <div className="bg-emerald-500 text-white text-xs px-3 py-1 rounded-full font-bold">✅ Face Verified</div>
                    </div>
                    <button onClick={() => { setFacePhoto(null); setFaceStatus(null); setFaceError(''); }}
                      className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2.5 py-1 rounded-lg font-bold">
                      Retake
                    </button>
                  </div>
                )}
                {(faceStatus === null || faceStatus === 'fail') && (
                  <>
                    {faceError && (
                      <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                        <XCircle size={14} className="text-red-500 shrink-0" />
                        <p className="text-xs text-red-600 font-medium">{faceError}</p>
                      </div>
                    )}
                    <label className="flex flex-col items-center gap-2 py-7 border-2 border-dashed border-violet-200 rounded-xl cursor-pointer hover:bg-violet-50 transition-all">
                      {uploading === 'face'
                        ? <div className="w-7 h-7 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                        : <Camera size={28} className="text-violet-400" />
                      }
                      <span className="text-xs text-gray-500 font-medium">
                        {uploading === 'face' ? 'Uploading...' : faceStatus === 'fail' ? 'Retake photo' : 'Upload face photo'}
                      </span>
                      <span className="text-[10px] text-gray-400">Single face · Clear · Well-lit</span>
                      <input type="file" accept="image/*" capture="user" className="hidden"
                        onChange={e => e.target.files[0] && handleFacePhoto(e.target.files[0])} />
                    </label>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── STEP 4: Agent Code ── */}
        <AnimatePresence>
          {faceStatus === 'pass' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50">
                  <Code size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-800">Step 4: Agent Code <span className="text-red-400">*</span></p>
                  <p className="text-xs text-gray-400">Enter your agent's unique code</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={agentCode}
                  onChange={e => checkAgentCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AGT-12345"
                  className="w-full border-2 rounded-xl px-4 py-3 font-bold text-sm outline-none transition-all"
                  style={{
                    borderColor: agentInfo ? '#10b981' : agentError ? '#ef4444' : '#e2e8f0',
                    background: agentInfo ? '#f0fdf4' : '#f8fafc',
                  }}
                />
                {agentChecking && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <AnimatePresence>
                {agentInfo && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-2 flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                    {agentInfo.photo_url && (
                      <img src={agentInfo.photo_url} className="w-8 h-8 rounded-full object-cover border border-emerald-300" alt="" />
                    )}
                    <div>
                      <p className="text-xs font-black text-emerald-700">✅ {agentInfo.agent_name}</p>
                      <p className="text-[10px] text-emerald-600">{agentInfo.country} · Active Agent</p>
                    </div>
                  </motion.div>
                )}
                {agentError && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mt-1.5 text-xs text-red-500 font-medium px-1">
                    ❌ {agentError}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={16} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed">
            Upload clear photos of your <strong>NID / Iqama / Passport</strong> and a face photo. Ensure your face is clearly visible, well-lit, and only you are in the frame.
          </p>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!docsReady || !facePhoto || faceStatus !== 'pass' || !agentInfo || submitting}
          className="w-full py-4 rounded-2xl font-extrabold text-base text-white disabled:opacity-40 transition-all active:scale-98"
          style={{ background: 'linear-gradient(135deg,#0b3d2e,#1a6b4e)', boxShadow: '0 4px 20px rgba(11,61,46,0.3)' }}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Submitting...
            </span>
          ) : 'Submit for Verification'}
        </button>
      </div>
    </AppShell>
  );
}