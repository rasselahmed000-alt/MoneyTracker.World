import { useState, useEffect, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, MessageCircle, Plane, FileText, X, CheckCircle2, XCircle, Eye, EyeOff, Wallet } from 'lucide-react';
import LiveActivityTicker from '../components/cellfin/LiveActivityTicker';
import IntlTransferSection from '../components/cellfin/IntlTransferSection';
import DynamicBannerCarousel from '../components/cellfin/DynamicBannerCarousel';
import { base44 } from '@/api/base44Client';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import NotificationPanel from '../components/cellfin/NotificationPanel';
import BottomNav from '../components/cellfin/BottomNav';
import { useAuth } from '@/lib/AuthContext';
import { preloadAboutUsData } from '@/lib/aboutusPreload';

// Default fallback data (used if admin has not configured HomeButton records)
const DEFAULT_MOBILE_PROVIDERS = [
  { id: 'bkash',  name: 'bKash',  logo: 'https://media.base44.com/images/public/69fdabac102db66d741fa29f/0aa010179_1780440626277.png', bg: '#e2136e', provider: 'bkash'  },
  { id: 'nagad',  name: 'Nagad',  logo: 'https://media.base44.com/images/public/69fdabac102db66d741fa29f/b9849f500_1780440344814.png',  bg: '#f7941d', provider: 'nagad'  },
  { id: 'rocket', name: 'Rocket', logo: 'https://media.base44.com/images/public/69fdabac102db66d741fa29f/afcbbe9dc_IMG_20260603_045402_210.png',  bg: '#6d28d9', provider: 'rocket' },
];
const DEFAULT_BANK_BTN = { id: 'bank', label: 'Bank', logo: 'https://media.base44.com/images/public/69fdabac102db66d741fa29f/b3c8f18ab_IMG-20260603-WA0024.jpg', path: '/bank-transfer' };
const DEFAULT_QUICK_ACTIONS = [
  { label: 'Visa\nApply',    image: 'https://media.base44.com/images/public/69fdabac102db66d741fa29f/c8f01396e_IMG_20260604_154726_202.png', path: '/visa' },
  { label: 'Air\nTicket',    image: 'https://media.base44.com/images/public/69fdabac102db66d741fa29f/8c74eab28_IMG_20260604_154659_861.png', path: '/air-ticket' },
  { label: 'Live\nChat',     image: 'https://media.base44.com/images/public/69fdabac102db66d741fa29f/e5b45a10a_IMG_20260604_154740_306.png', path: '/support' },
  { label: 'Group\nChat',    image: 'https://media.base44.com/images/public/69fdabac102db66d741fa29f/b82336e15_low-poly-style-group-chat-logo-symbol-people-logo-sign-free-vector.jpg', path: '/group-chat' },
];

const ProviderButton = memo(function ProviderButton({ p, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform duration-100"
    >
      <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md relative"
        style={{ background: p.bg, boxShadow: `0 6px 16px ${p.bg}55` }}>
        <img src={p.logo} alt={p.name} className="w-full h-full object-cover"
          loading="eager" decoding="sync" />
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[9px] font-black shadow-md">₊</div>
      </div>
      <span className="text-[9px] font-bold text-gray-600 truncate w-full text-center">{p.name}</span>
    </button>
  );
});

const ServiceButton = memo(function ServiceButton({ a, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform duration-100"
    >
      {a.useImage ? (
        <div className="w-12 h-12 rounded-full overflow-hidden shadow-md flex items-center justify-center"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
          <img src={a.image} alt={a.label} className="w-full h-full object-cover" loading="eager" />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
          style={{ background: a.gradient, boxShadow: `0 5px 14px ${a.glow}` }}>
          <a.icon size={20} color="#fff" strokeWidth={2} />
        </div>
      )}
      <span className="text-[9px] font-bold text-gray-600 text-center leading-tight whitespace-pre-line">{a.label}</span>
    </button>
  );
});

export default function Home() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [homeButtons, setHomeButtons] = useState([]);
  const [balanceHidden, setBalanceHidden] = useState(true);
  const [showNotif, setShowNotif] = useState(false);
  const [unread, setUnread] = useState(0);
  const [txToast, setTxToast] = useState(null);
  const timerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const notifLoadedRef = useRef(false);
  const unsubRef = useRef(null);
  const refreshDebounceRef = useRef(null);

  // Load notification count — once per session
  useEffect(() => {
    if (!user?.email || notifLoadedRef.current) return;
    notifLoadedRef.current = true;
    base44.entities.AppNotification.list('-created_date', 50)
      .then(all => {
        const mine = (all || []).filter(n => !n.target_email || n.target_email === user.email);
        setUnread(mine.filter(n => !(n.is_read_by || []).includes(user.email)).length);
      })
      .catch(() => {});
  }, [user?.email]);

  // Transaction subscription — show toast + refresh balance on any status change
  useEffect(() => {
    let unsub = null;

    const subscribe = () => {
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
      unsub = base44.entities.Transaction.subscribe((event) => {
        const txStatus = event.data?.status;
        const isRelevant =
          (event.type === 'update' && (txStatus === 'success' || txStatus === 'failed')) ||
          (event.type === 'create' && txStatus === 'success' && event.data?.type === 'receive');

        if (!isRelevant) return;

        setTxToast(event.data);
        setUnread(p => p + 1);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setTxToast(null), 5000);

        if (refreshDebounceRef.current) clearTimeout(refreshDebounceRef.current);
        refreshDebounceRef.current = setTimeout(() => refreshUser(), 800);
      });
      unsubRef.current = unsub;
    };

    subscribe();

    // Reconnect on visibility change (fixes WebSocket timeout after background)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') subscribe();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
      document.removeEventListener('visibilitychange', onVisibility);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (refreshDebounceRef.current) clearTimeout(refreshDebounceRef.current);
    };
  }, []); // eslint-disable-line

  // User balance real-time sync (from admin direct balance update)
  useEffect(() => {
    if (!user?.id) return;
    const unsubUser = base44.entities.User.subscribe((event) => {
      if (event.type !== 'update' || event.id !== user.id) return;
      // Admin changed this user's balance/data — refresh immediately
      refreshUser();
    });
    return () => unsubUser();
  }, [user?.id]); // eslint-disable-line

  // Profile updated event — refresh from context
  useEffect(() => {
    const onProfileUpdated = () => refreshUser();
    window.addEventListener('user_profile_updated', onProfileUpdated);
    return () => window.removeEventListener('user_profile_updated', onProfileUpdated);
  }, [refreshUser]);

  usePushNotifications(user);

  // Load dynamic home buttons from admin config
  useEffect(() => {
    base44.entities.HomeButton.filter({ is_active: true }, 'sort_order', 50)
      .then(data => setHomeButtons(data || []))
      .catch(() => setHomeButtons([]));
  }, []);

  // Pre-fetch About Us page data on component mount
  useEffect(() => {
    preloadAboutUsData().catch(() => {});
  }, []);

  const handleBalanceClick = () => {
    setBalanceHidden(p => !p);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setBalanceHidden(true), 3000);
  };

  const balance  = user?.balance ?? 0;
  const fullName = user?.display_name || user?.full_name || '—'; // Always prefer display_name
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div
      className="max-w-[430px] mx-auto font-inter flex flex-col bg-[#f0f2f5]"
      style={{
        height: '100dvh',
        overflow: 'hidden',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
      }}
    >
      {/* ── Transaction Toast ── */}
      <AnimatePresence>
        {txToast && (
          <motion.div
            key={txToast.id + txToast.status}
            initial={{ opacity: 0, y: -70 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -70 }}
            transition={{ type: 'spring', bounce: 0.38 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[410px] z-[999] rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3"
            style={txToast.status === 'success'
              ? { background: 'linear-gradient(135deg,#052e16,#065f46)', border: '1px solid #10b98155' }
              : { background: 'linear-gradient(135deg,#450a0a,#7f1d1d)', border: '1px solid #ef444455' }}
          >
            {txToast.status === 'success'
              ? <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
              : <XCircle size={22} className="text-red-400 shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-sm text-white">
                {txToast.type === 'receive'
                  ? '💰 রিফান্ড পেয়েছেন!'
                  : txToast.status === 'success'
                    ? '✅ লেনদেন সফল হয়েছে!'
                    : '❌ লেনদেন বাতিল হয়েছে'}
              </p>
              <p className="text-[11px] text-white/60 truncate mt-0.5">
                ৳{(txToast.amount || 0).toLocaleString()} — {txToast.description || txToast.type}
              </p>
            </div>
            <button onClick={() => setTxToast(null)} className="text-white/40 hover:text-white shrink-0">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Notification overlay ── */}
      <AnimatePresence>
        {showNotif && (
          <NotificationPanel user={user}
            onClose={() => { setShowNotif(false); setUnread(0); }} />
        )}
      </AnimatePresence>

      {/* ════════ FIXED HEADER ════════ */}
      <div
        className="shrink-0 relative z-40"
        style={{
          background: 'linear-gradient(160deg,#0b3d1e 0%,#0f5030 55%,#0b3d1e 100%)',
          paddingTop: 'env(safe-area-inset-top, 16px)',
        }}
      >
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, #ffffff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

        <div className="relative px-5 pt-3.5 pb-4" style={{ minHeight: 94 }}>
          {/* Row 1: Greeting + Bell */}
          <div className="flex items-start justify-between mb-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold mb-0.5" style={{ color: '#a3e6b8', letterSpacing: '0.02em' }}>
                {greeting} 👋
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-white font-black text-[16px] leading-tight tracking-tight">{fullName}</p>
                {user?.kyc_status === 'approved' && (
                  <div className="flex items-center gap-0.5 px-1.5 py-[2px] rounded-full"
                    style={{ background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.35)' }}>
                    <div className="w-2.5 h-2.5 rounded-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                      <span className="text-white font-black" style={{ fontSize: 6, lineHeight: 1 }}>✓</span>
                    </div>
                    <span className="font-bold" style={{ color: '#4ade80', fontSize: 8.5 }}>Verified</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowNotif(true)}
              className="relative w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              <Bell size={16} color="#fff" strokeWidth={1.8} />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{ background: '#22c55e', boxShadow: '0 0 0 1.5px rgba(11,61,30,0.9)' }} />
              )}
            </button>
          </div>

          {/* Row 2: Balance + Add Money */}
          <div className="flex items-stretch gap-2.5">
            <button
              onClick={handleBalanceClick}
              className="flex items-center gap-2 rounded-xl flex-1 active:scale-97 transition-transform duration-100"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.13)',
                backdropFilter: 'blur(16px)',
                padding: '9px 12px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(34,197,94,0.2)' }}>
                <Wallet size={14} color="#4ade80" strokeWidth={2} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[8px] font-bold mb-0.5 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>Balance</p>
                <div className="flex items-center gap-1">
                  <span className="font-black text-[12px]" style={{ color: '#86efac' }}>৳</span>
                  {balanceHidden
                    ? <span className="font-bold text-xs" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '0.18em' }}>• • • • •</span>
                    : <span className="font-mono font-black text-white text-xs">{balance.toLocaleString()}</span>}
                </div>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.3)' }}>
                {balanceHidden ? <EyeOff size={13} /> : <Eye size={13} />}
              </div>
            </button>

            <button
              onClick={() => navigate('/add-money')}
              className="flex items-center justify-center gap-1.5 rounded-xl font-black text-[12px] px-4 active:scale-95 transition-transform duration-100"
              style={{
                background: 'linear-gradient(135deg,#22c55e 0%,#16a34a 100%)',
                color: '#fff',
                boxShadow: '0 3px 14px rgba(34,197,94,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                minWidth: 124,
              }}
            >
              <div className="w-4.5 h-4.5 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.25)' }}>
                <Plus size={11} strokeWidth={3} color="#fff" />
              </div>
              Add Money
            </button>
          </div>
        </div>

        <div className="h-[1px]" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* ════════ SCROLLABLE CONTENT ════════ */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          scrollBehavior: 'smooth',
          WebkitOverscrollBehavior: 'none',
        }}
      >
        <div className="flex flex-col gap-[2px] bg-[#eef0f3] pb-24">

          {/* Live Activity */}
          <div className="bg-white px-4 pt-2 pb-1.5">
            <div className="rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <LiveActivityTicker />
            </div>
          </div>

          {/* Quick Transfer — dynamic from admin */}
          {(() => {
            const dbMobile = homeButtons.filter(b => b.type === 'mobile_provider');
            const dbBank = homeButtons.filter(b => b.type === 'bank_transfer');
            const mobileList = dbMobile.length > 0
              ? dbMobile.map(b => ({ id: b.id, name: b.label, logo: b.image_url, bg: b.bg_color || '#10b981', provider: b.provider_key }))
              : DEFAULT_MOBILE_PROVIDERS;
            const bankBtn = dbBank.length > 0 ? dbBank[0] : DEFAULT_BANK_BTN;
            return (
              <div className="bg-white px-4 py-2.5">
                <p className="text-[8.5px] font-black text-gray-350 uppercase tracking-widest mb-2">Quick Transfer</p>
                <div className="grid grid-cols-4 gap-2">
                  {mobileList.map((p) => (
                    <ProviderButton
                      key={p.id}
                      p={p}
                      onClick={() => navigate(`/mobile-banking-transfer?provider=${p.provider}`)}
                    />
                  ))}
                  <button
                    onClick={() => navigate(bankBtn.nav_path || bankBtn.path || '/bank-transfer')}
                    className="flex flex-col items-center gap-1 active:scale-95 transition-transform duration-100"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden shadow-sm"
                      style={{ boxShadow: '0 2px 8px rgba(30, 93, 145, 0.25)' }}>
                      <img src={bankBtn.image_url || bankBtn.logo}
                        alt={bankBtn.label || 'Bank Transfer'} className="w-full h-full object-cover"
                        loading="eager" decoding="sync" />
                    </div>
                    <span className="text-[8.5px] font-bold text-gray-600 truncate w-full text-center">{bankBtn.label || 'Bank'}</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Services — dynamic from admin */}
          {(() => {
            const dbServices = homeButtons.filter(b => b.type === 'service');
            const serviceList = dbServices.length > 0
              ? dbServices.map(b => ({ label: b.label, image: b.image_url, path: b.nav_path }))
              : DEFAULT_QUICK_ACTIONS;
            return (
              <div className="bg-white px-4 py-2.5">
                <p className="text-[8.5px] font-black text-gray-350 uppercase tracking-widest mb-2">Services</p>
                <div className="grid grid-cols-4 gap-2">
                  {serviceList.map((a) => (
                    <ServiceButton key={a.label} a={{ ...a, useImage: true }} onClick={() => navigate(a.path)} />
                  ))}
                </div>
              </div>
            );
          })()}

          {/* International Transfer */}
          <div className="bg-white px-4 py-2.5">
            <IntlTransferSection />
          </div>

          {/* Promo Banners */}
          <div className="bg-[#f8f9fa] px-4 py-2.5">
            <DynamicBannerCarousel />
          </div>

        </div>
      </div>

      {/* ════════ BOTTOM NAV ════════ */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <BottomNav />
      </div>
    </div>
  );
}