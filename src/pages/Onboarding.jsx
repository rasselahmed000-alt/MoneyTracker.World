import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Send, ShieldCheck, Globe2, Zap } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Skip onboarding if already seen
    if (localStorage.getItem('onboarding_completed')) {
      navigate('/', { replace: true });
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    navigate('/', { replace: true });
  };

  const steps = [
    {
      title: 'Money Tracker',
      subtitle: 'প্রবাসে আয়, দেশে পাঠান সহজে',
      description: 'নিরাপদ, দ্রুত এবং সহজ রেমিট্যান্স সার্ভিস',
      icon: '🌐',
      gradient: 'linear-gradient(135deg, #0b3d2e 0%, #1a6b4e 100%)',
    },
    {
      title: 'দ্রুত পাঠান',
      subtitle: 'মিনিটের মধ্যে টাকা পৌঁছায়',
      description: '৫০+ দেশে তাৎক্ষণিক ট্রান্সফার',
      icon: '⚡',
      gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    },
    {
      title: 'সম্পূর্ণ নিরাপদ',
      subtitle: 'ব্যাংক-গ্রেড সিকিউরিটি',
      description: 'আপনার টাকা সম্পূর্ণ সুরক্ষিত এবং এনক্রিপ্টেড',
      icon: '🔐',
      gradient: 'linear-gradient(135deg, #0f4d3a 0%, #059669 100%)',
    },
    {
      title: 'সেরা রেট',
      subtitle: 'বাজারের সেরা এক্সচেঞ্জ রেট',
      description: 'কোনো লুকানো চার্জ নেই',
      icon: '💰',
      gradient: 'linear-gradient(135deg, #0b3d2e 0%, #0f4d3a 100%)',
    },
  ];

  const currentStep = steps[step];

  return (
    <div className="max-w-[430px] mx-auto font-inter min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #0f1525 100%)' }}>
      
      {/* Progress bar */}
      <div className="px-6 pt-6">
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full transition-all"
              style={{ background: i <= step ? '#10b981' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          {/* Icon */}
          <div className="text-6xl mb-6">{currentStep.icon}</div>

          {/* Title */}
          <h1 className="text-white font-black text-3xl mb-2 leading-tight">
            {currentStep.title}
          </h1>

          {/* Subtitle */}
          <p className="text-emerald-300 font-bold text-lg mb-3">
            {currentStep.subtitle}
          </p>

          {/* Description */}
          <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xs">
            {currentStep.description}
          </p>

          {/* Features */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-3 mt-10 mb-8">
              {[
                { icon: Send, label: 'দ্রুত' },
                { icon: ShieldCheck, label: 'নিরাপদ' },
                { icon: Globe2, label: 'বৈশ্বিক' },
                { icon: Zap, label: 'সহজ' },
              ].map((f) => (
                <div key={f.label}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <f.icon size={20} className="text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300">{f.label}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Buttons */}
      <div className="px-6 pb-8 space-y-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            if (step < steps.length - 1) {
              setStep(step + 1);
            } else {
              handleComplete();
            }
          }}
          className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 text-white transition-all"
          style={{
            background: currentStep.gradient,
            boxShadow: '0 8px 24px rgba(16,185,129,0.4)',
          }}
        >
          {step === steps.length - 1 ? (
            <>
              শুরু করুন
              <ArrowRight size={18} />
            </>
          ) : (
            <>
              পরবর্তী
              <ArrowRight size={18} />
            </>
          )}
        </motion.button>

        {step < steps.length - 1 && (
          <button
            onClick={handleComplete}
            className="w-full py-3 rounded-2xl font-bold text-base text-white transition-all"
            style={{
              background: 'transparent',
              border: '1.5px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            এখনই শুরু করুন
          </button>
        )}
      </div>
    </div>
  );
}