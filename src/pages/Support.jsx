import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import AppShell from '../components/cellfin/AppShell';
import UniversalHeader from '@/components/cellfin/UniversalHeader';

const PLATFORM_CONFIG = {
  whatsapp: {
    emoji: '💬',
    label: 'WhatsApp',
    tagline: 'সরাসরি মেসেজ করুন',
    gradient: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)',
    glow: 'rgba(37,211,102,0.35)',
    border: 'rgba(37,211,102,0.3)',
    bg: 'linear-gradient(135deg, rgba(37,211,102,0.08), rgba(18,140,126,0.04))',
    btnGradient: 'linear-gradient(135deg, #25d366, #128c7e)',
    btnText: 'Chat Now',
  },
  telegram: {
    emoji: '✈️',
    label: 'Telegram',
    tagline: 'Telegram-এ যোগাযোগ করুন',
    gradient: 'linear-gradient(135deg, #2aabee 0%, #0088cc 100%)',
    glow: 'rgba(42,171,238,0.35)',
    border: 'rgba(42,171,238,0.3)',
    bg: 'linear-gradient(135deg, rgba(42,171,238,0.08), rgba(0,136,204,0.04))',
    btnGradient: 'linear-gradient(135deg, #2aabee, #0088cc)',
    btnText: 'Open Telegram',
  },
  imo: {
    emoji: '📲',
    label: 'IMO',
    tagline: 'IMO-তে কল করুন',
    gradient: 'linear-gradient(135deg, #0084ff 0%, #0060c0 100%)',
    glow: 'rgba(0,132,255,0.35)',
    border: 'rgba(0,132,255,0.3)',
    bg: 'linear-gradient(135deg, rgba(0,132,255,0.08), rgba(0,96,192,0.04))',
    btnGradient: 'linear-gradient(135deg, #0084ff, #0060c0)',
    btnText: 'Contact Now',
  },
};

export default function Support() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.SupportContact.list('sort_order', 20)
      .then(data => setContacts((data || []).filter(c => c.is_active !== false)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleOpen = (contact) => {
    let url = contact.link;
    if (!url) {
      if (contact.platform === 'whatsapp') url = `https://wa.me/${(contact.value || '').replace(/\D/g, '')}`;
      else if (contact.platform === 'telegram') url = `https://t.me/${contact.value}`;
      else url = contact.value;
    }
    if (url) window.open(url, '_blank');
  };

  return (
    <AppShell header={
      <UniversalHeader
        title="24/7 Support"
        subtitle="আমরা সবসময় আপনার পাশে আছি"
        rightAction={<Headphones size={20} className="text-white" />}
      />
    }>
      {/* Content */}
      <div className="p-5 space-y-5 pb-24">
        {/* Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden p-6 text-center"
          style={{ background: 'linear-gradient(135deg, #0b3d2e 0%, #0f5030 50%, #1a6b42 100%)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-4xl"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              🎧
            </div>
            <p className="font-black text-white text-lg">আমরা সবসময় আপনার পাশে</p>
            <p className="text-white/60 text-xs mt-1">24 ঘণ্টা · 7 দিন · সকল প্ল্যাটফর্মে</p>
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-300 text-[11px] font-bold">Support Online</span>
            </div>
          </div>
        </div>

        {/* Support Channels */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <p className="text-2xl mb-2">⚠️</p>
            <p className="font-bold text-amber-700">Support contact info coming soon...</p>
            <p className="text-amber-600 text-xs mt-1">আমরা খুব শীঘ্রই এই সেবা চালু করব</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contacts.map((c, idx) => {
              const cfg = PLATFORM_CONFIG[c.platform] || {
                emoji: '📞', label: c.platform, tagline: 'Contact us',
                gradient: 'linear-gradient(135deg,#6b7280,#4b5563)',
                glow: 'rgba(107,114,128,0.3)', border: 'rgba(107,114,128,0.2)',
                bg: 'linear-gradient(135deg,rgba(107,114,128,0.06),rgba(75,85,99,0.03))',
                btnGradient: 'linear-gradient(135deg,#6b7280,#4b5563)', btnText: 'Contact Now',
              };
              return (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => handleOpen(c)}
                  whileHover={{ y: -4, boxShadow: `0 16px 40px ${cfg.glow}` }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-3xl p-5 text-left transition-all"
                  style={{
                    background: cfg.bg,
                    border: `2px solid ${cfg.border}`,
                    boxShadow: `0 4px 16px ${cfg.glow.replace('0.35', '0.12')}`,
                  }}>
                  <div className="flex items-center gap-4">
                    {/* Icon circle */}
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0 shadow-lg"
                      style={{ background: cfg.gradient, boxShadow: `0 8px 24px ${cfg.glow}` }}>
                      {cfg.emoji}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 text-base leading-tight">{c.label || cfg.label}</p>
                      <p className="text-gray-500 text-[12px] mt-1 truncate">{c.value || cfg.tagline}</p>
                      <p className="text-[11px] font-semibold mt-2" style={{ color: cfg.gradient.includes('#25d366') ? '#16a34a' : cfg.gradient.includes('#2aabee') ? '#0088cc' : '#0060c0' }}>
                        {cfg.tagline}
                      </p>
                    </div>
                    <ExternalLink size={18} className="text-gray-400 shrink-0" />
                  </div>
                  {/* Action button */}
                  <div className="mt-4 w-full py-3 rounded-2xl flex items-center justify-center gap-2 text-white font-black text-[13px]"
                    style={{ background: cfg.btnGradient, boxShadow: `0 4px 16px ${cfg.glow}` }}>
                    {cfg.btnText} →
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* FAQ Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-border overflow-hidden mt-8">
          <div className="bg-forest/10 px-5 py-4 border-b border-border">
            <p className="font-black text-sm text-forest">❓ সাধারণ প্রশ্ন</p>
          </div>
          <div className="divide-y divide-border">
            {[
              { q: 'কীভাবে যোগাযোগ করব?', a: 'উপরের যেকোনো option-এ ক্লিক করে সরাসরি যোগাযোগ করতে পারেন।' },
              { q: 'জরুরি সমস্যা হলে কী করব?', a: 'WhatsApp অথবা Telegram দ্রুততম মাধ্যম। তাৎক্ষণিক সাহায্য পাবেন।' },
              { q: 'সাপোর্ট খোলা কখন?', a: '২৪/৭ - সপ্তাহের সব দিন, সারাদিন আমরা সক্রিয় থাকি।' },
            ].map((item, i) => (
              <details key={i} className="px-5 py-4 cursor-pointer group">
                <summary className="font-bold text-gray-800 text-sm flex items-center justify-between">
                  <span>{item.q}</span>
                  <span className="text-forest group-open:rotate-180 transition-transform text-xl">▼</span>
                </summary>
                <p className="text-gray-600 text-xs mt-2">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* Security Note */}
        <p className="text-center text-[10px] text-gray-400 pb-2">
          🔒 আপনার তথ্য সম্পূর্ণ নিরাপদ ও গোপনীয়
        </p>
      </div>
    </AppShell>
  );
}