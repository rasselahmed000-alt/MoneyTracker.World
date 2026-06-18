import { useState, useRef } from 'react';
import { Lock, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ADMIN_PIN = '9889';

export default function AdminPINVerification({ onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRef = useRef(null);

  const handlePINChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    setPin(value);
    setError('');

    if (value.length === 4) {
      if (value === ADMIN_PIN) {
        setSuccess(true);
        setTimeout(() => onSuccess(), 800);
      } else {
        setError('Invalid PIN');
        setPin('');
      }
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex flex-col items-center gap-4 p-8"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center">
            <CheckCircle size={32} className="text-white" />
          </div>
          <p className="text-white font-bold">Verified</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-8"
      >
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <Lock size={24} className="text-emerald-600" />
          </div>
        </div>

        <h1 className="text-center font-black text-2xl text-slate-900 mb-2">Admin Verification</h1>
        <p className="text-center text-sm text-slate-500 mb-8">Enter your 4-digit PIN to access admin panel</p>

        <input
          ref={inputRef}
          type="password"
          value={pin}
          onChange={handlePINChange}
          inputMode="numeric"
          maxLength="4"
          placeholder="••••"
          className={`w-full text-center text-4xl font-black tracking-widest py-4 rounded-2xl border-2 outline-none transition-all mb-4 ${
            error
              ? 'border-red-300 bg-red-50 text-red-600'
              : 'border-slate-200 bg-slate-50 text-slate-900'
          }`}
          autoFocus
        />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-red-600 text-sm font-bold mb-4 px-3 py-2 bg-red-50 rounded-xl"
          >
            <XCircle size={16} />
            {error}
          </motion.div>
        )}

        <p className="text-center text-xs text-slate-400 font-medium">
          {pin.length === 0 ? 'Enter PIN' : pin.length === 4 ? 'Verifying...' : `${4 - pin.length} more digits`}
        </p>
      </motion.div>
    </div>
  );
}