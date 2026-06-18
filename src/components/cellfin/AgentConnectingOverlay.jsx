import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Wifi, Lock, CheckCircle2, Star } from 'lucide-react';

const STEPS = [
  { icon: Wifi,         label: 'এজেন্ট খোঁজা হচ্ছে...',          sub: 'Finding available agent',    color: '#3b82f6' },
  { icon: Shield,       label: 'পরিচয় যাচাই হচ্ছে...',           sub: 'Verifying agent credentials', color: '#8b5cf6' },
  { icon: Lock,         label: 'নিরাপদ সংযোগ তৈরি হচ্ছে...',     sub: 'Establishing secure channel', color: '#f59e0b' },
  { icon: CheckCircle2, label: 'সংযুক্ত! চ্যাট শুরু হচ্ছে...', sub: 'Connected successfully',       color: '#22c55e' },
];

const TOTAL_MS = 6000;

export default function AgentConnectingOverlay({ agent, onConnected }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [imgErr, setImgErr] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const iv = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / TOTAL_MS) * 100, 100);
      setProgress(pct);
      if (elapsed >= TOTAL_MS) clearInterval(iv);
    }, 60);

    const t0 = setTimeout(() => setStep(1), 1400);
    const t1 = setTimeout(() => setStep(2), 3000);
    const t2 = setTimeout(() => setStep(3), 4800);
    const t3 = setTimeout(() => { setDone(true); setTimeout(onConnected, 600); }, TOTAL_MS);

    return () => { clearInterval(iv); clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const avatarUrl = imgErr
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&background=0B3D2E&color=D4A843&size=200&bold=true`
    : agent.img;

  const currentStep = STEPS[step];
  const StepIcon = currentStep.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
      className="absolute inset-0 z-30 flex flex-col overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0a2e1e 0%, #0f4d2e 40%, #0b3822 100%)' }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #22c55e, transparent)' }} />
      <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full opacity-8"
        style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />

      {/* Header */}
      <div className="shrink-0 px-6 pt-14 pb-4 text-center">
        <p className="text-emerald-300/70 text-[11px] font-bold uppercase tracking-[0.2em] mb-1">Live Support</p>
        <h1 className="text-white font-black text-xl tracking-tight">এজেন্টের সাথে সংযুক্ত হচ্ছি</h1>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">

        {/* Avatar with pulsing rings */}
        <div className="relative mb-8">
          {/* Outer pulse rings */}
          {[1, 2, 3].map(i => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                inset: -i * 14,
                border: `1.5px solid rgba(34,197,94,${0.25 - i * 0.06})`,
              }}
              animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.15, 0.5] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
            />
          ))}

          {/* Avatar */}
          <motion.div
            animate={{ scale: done ? 1.08 : 1 }}
            transition={{ duration: 0.4 }}
            className="relative w-24 h-24 rounded-3xl overflow-hidden z-10"
            style={{
              boxShadow: '0 0 0 3px rgba(34,197,94,0.4), 0 12px 40px rgba(0,0,0,0.5)',
              border: '2px solid rgba(34,197,94,0.5)',
            }}
          >
            <img
              src={avatarUrl}
              onError={() => setImgErr(true)}
              alt={agent.name}
              className="w-full h-full object-cover"
            />
            {/* Shimmer overlay while loading */}
            {!done && (
              <motion.div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)' }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </motion.div>

          {/* Online dot */}
          <motion.div
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center z-20"
            style={{ background: '#22c55e', border: '2.5px solid #0a2e1e', boxShadow: '0 2px 8px rgba(34,197,94,0.6)' }}
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            <div className="w-2 h-2 rounded-full bg-white/80" />
          </motion.div>
        </div>

        {/* Agent info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-2"
        >
          <h2 className="text-white font-black text-xl tracking-tight mb-0.5">{agent.name}</h2>
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <div className="px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <p className="text-emerald-300 text-[10px] font-bold">{agent.role}</p>
            </div>
          </div>
          {/* Stars */}
          <div className="flex items-center justify-center gap-0.5">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={11} fill="#f59e0b" color="#f59e0b" />
            ))}
            <span className="text-white/40 text-[9px] ml-1 font-bold">4.9</span>
          </div>
        </motion.div>

        {/* Step indicator card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.28 }}
            className="w-full rounded-2xl px-4 py-3.5 mb-6 flex items-center gap-3"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <motion.div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${currentStep.color}22`, border: `1px solid ${currentStep.color}44` }}
              animate={step < 3 ? { rotate: [0, 8, -8, 0] } : {}}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <StepIcon size={18} color={currentStep.color} strokeWidth={2} />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">{currentStep.label}</p>
              <p className="text-white/40 text-[10px] mt-0.5 font-medium">{currentStep.sub}</p>
            </div>
            {step === 3 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
                <CheckCircle2 size={20} color="#22c55e" />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="w-full mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">সংযোগ হচ্ছে</span>
            <span className="font-black text-sm" style={{ color: currentStep.color }}>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, #10b981, ${currentStep.color})`,
                boxShadow: `0 0 8px ${currentStep.color}88`,
                transition: 'width 0.08s linear',
              }}
            />
          </div>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <motion.div
              key={i}
              animate={{
                width: step === i ? 24 : 6,
                backgroundColor: step > i ? '#22c55e' : step === i ? s.color : 'rgba(255,255,255,0.15)',
              }}
              transition={{ duration: 0.35 }}
              className="h-1.5 rounded-full"
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 pb-10 px-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <Lock size={10} color="rgba(255,255,255,0.25)" />
          <p className="text-white/25 text-[10px] font-medium">End-to-end encrypted · Cellfin Support</p>
        </div>
      </div>
    </motion.div>
  );
}