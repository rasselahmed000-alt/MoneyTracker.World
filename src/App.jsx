import { useState, useEffect, useRef, lazy, Suspense, memo } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientOptimized } from '@/lib/query-optimized'
import { HashRouter as Router, Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { isFirebaseConfigured, saveFirebaseConfig } from '@/api/firebaseClient';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ErrorBoundary from '@/components/cellfin/ErrorBoundary';
import DeepLinkHandler from '@/components/DeepLinkHandler';

// Customer Pages (eagerly loaded — fast first paint)
import Home from './pages/Home.jsx';
import Welcome from './pages/Welcome.jsx';
import GeoRestriction from './components/cellfin/GeoRestriction';
import AppLockScreen, { recordActivity, markSessionUnlocked, isSessionLocked, checkBackgroundLock } from './components/cellfin/AppLockScreen';
import PreloadOptimization from './components/cellfin/PreloadOptimization';
import PWAInstallBanner from './components/cellfin/PWAInstallBanner';
import OfflineDetector from './components/cellfin/OfflineDetector';
import History from './pages/History';
import Profile from './pages/Profile';
import BankTransferOptimized from './pages/BankTransferOptimized';

// Customer Pages (lazy loaded — static imports required for Vite production build)
const SupportChat    = lazy(() => import('./pages/SupportChat.jsx'));
const GroupChat      = lazy(() => import('./pages/GroupChat.jsx'));
const Support        = lazy(() => import('./pages/Support.jsx'));
const AddMoney       = lazy(() => import('./pages/AddMoney.jsx'));
const DepositOptions = lazy(() => import('./pages/DepositOptions.jsx'));
const MobileBankingTransfer = lazy(() => import('./pages/MobileBankingTransfer.jsx'));
const Wallet         = lazy(() => import('./pages/Wallet.jsx'));
const ExchangeRates  = lazy(() => import('./pages/ExchangeRates.jsx'));
const KYC            = lazy(() => import('./pages/KYC.jsx'));
const ManualDeposit  = lazy(() => import('./pages/ManualDeposit.jsx'));
const AirTicket      = lazy(() => import('./pages/AirTicket.jsx'));
const VisaApplication = lazy(() => import('./pages/VisaApplication.jsx'));
const PayRedirect    = lazy(() => import('./pages/PayRedirect.jsx'));
const IntlTransfer   = lazy(() => import('./pages/IntlTransfer.jsx'));
const AboutUs        = lazy(() => import('./pages/AboutUs.jsx'));

// Admin Pages — lazy loaded (static imports for Vite)
const AdminDashboard      = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminUsers          = lazy(() => import('./pages/admin/AdminUsers.jsx'));
const AdminTransactions   = lazy(() => import('./pages/admin/AdminTransactions.jsx'));
const AdminManualDeposits = lazy(() => import('./pages/admin/AdminManualDeposits.jsx'));
const AdminWalletRequests = lazy(() => import('./pages/admin/AdminWalletRequests.jsx'));
const AdminCountries      = lazy(() => import('./pages/admin/AdminCountries.jsx'));
const AdminExchangeRates  = lazy(() => import('./pages/admin/AdminExchangeRates.jsx'));
const AdminDepositPackages = lazy(() => import('./pages/admin/AdminDepositPackages.jsx'));
const AdminNotifications  = lazy(() => import('./pages/admin/AdminNotifications.jsx'));
const AdminBanners        = lazy(() => import('./pages/admin/AdminBanners.jsx'));
const AdminAirTickets     = lazy(() => import('./pages/admin/AdminAirTickets.jsx'));
const AdminVisaApps       = lazy(() => import('./pages/admin/AdminVisaApps.jsx'));
const AdminVisaServices   = lazy(() => import('./pages/admin/AdminVisaServices.jsx'));
const AdminAirTicketRoutes = lazy(() => import('./pages/admin/AdminAirTicketRoutes.jsx'));
const AdminMinBalance     = lazy(() => import('./pages/admin/AdminMinBalance.jsx'));
const AdminSupportChats   = lazy(() => import('./pages/admin/AdminSupportChats.jsx'));
const AdminGroupChat      = lazy(() => import('./pages/admin/AdminGroupChat.jsx'));
const AdminIntlTransfer   = lazy(() => import('./pages/admin/AdminIntlTransfer.jsx'));
const AdminSupportContacts = lazy(() => import('./pages/admin/AdminSupportContacts.jsx'));
const AdminCompanyInfo    = lazy(() => import('./pages/admin/AdminCompanyInfo.jsx'));
const AdminAboutUs        = lazy(() => import('./pages/admin/AdminAboutUs.jsx'));
const AdminBanks          = lazy(() => import('./pages/admin/AdminBanks.jsx'));
const AdminVirtualAgents  = lazy(() => import('./pages/admin/AdminVirtualAgents.jsx'));
const AdminGeoRestriction = lazy(() => import('./pages/admin/AdminGeoRestriction.jsx'));
const AdminAgentKYC      = lazy(() => import('./pages/admin/AdminAgentKYC.jsx'));
const AdminManagement    = lazy(() => import('./pages/admin/AdminManagement.jsx'));
const AdminHomeConfig    = lazy(() => import('./pages/admin/AdminHomeConfig.jsx'));

// ─────────────────────────────────────────────
// LOGIN REDIRECT — fires once, no loop
// ─────────────────────────────────────────────
function LoginRedirect() {
  const navigate = useNavigate();
  const redirectedRef = useRef(false);
  useEffect(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    navigate('/welcome', { replace: true });
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-5"
      style={{ background: 'linear-gradient(160deg,#0b3d2e 0%,#0f4d36 60%,#0a3828 100%)' }}>
      <div className="w-20 h-20 rounded-[24px] flex items-center justify-center shadow-2xl"
        style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 20px 50px rgba(16,185,129,0.45)' }}>
        <span className="text-white font-black text-4xl" style={{ lineHeight: 1 }}>৳</span>
      </div>
      <div className="text-center">
        <p className="text-white font-black text-xl tracking-tight">Money Tracker</p>
        <p className="text-white/40 text-xs mt-1">Redirecting to login...</p>
      </div>
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ADMIN PIN VERIFICATION — before admin routes
// ─────────────────────────────────────────────
function AdminSectionWithPIN() {
  const navigate = useNavigate();
  const { user, status, isAdmin } = useAuth();
  const [pinVerified, setPinVerified] = useState(false);
  const redirectedRef = useRef(false);
  const AdminPINVerification = lazy(() => import('./components/AdminPINVerification'));

  // Redirect to login only once if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated' && !redirectedRef.current) {
      redirectedRef.current = true;
      navigate('/welcome', { replace: true });
    }
  }, [status, navigate]);

  if (status === 'loading') return <PageSpinner />;
  if (status === 'unauthenticated') return <PageSpinner />;
  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  if (!pinVerified) {
    return (
      <Suspense fallback={<PageSpinner />}>
        <AdminPINVerification onSuccess={() => setPinVerified(true)} />
      </Suspense>
    );
  }

  return <AdminSectionContent />;
}

// Minimal page-level spinner for Suspense fallback
const PageSpinner = () => (
  <div className="fixed inset-0 flex flex-col items-center justify-center gap-3" style={{ background: '#0b3d2e' }}>
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
      style={{ background: 'rgba(255,255,255,0.12)' }}>
      <span className="text-white font-black text-xl">৳</span>
    </div>
    <div className="flex gap-1">
      {[0,1,2].map(i => (
        <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"
          style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// ADMIN GUARD — Base44 Role-based Access
// ─────────────────────────────────────────────
const AdminGuard = memo(function AdminGuard({ children }) {
  const { user, status } = useAuth();
  
  if (status === 'loading') return <PageSpinner />;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  
  return children;
});

function AdminSectionGuard() {
  const { user, status } = useAuth();

  // Unauthenticated users → redirect to login
  if (status === 'loading') return <PageSpinner />;
  if (status === 'unauthenticated') return <LoginRedirect />;

  // Non-admin users → redirect to home
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;

  return <AdminSectionContent />;
}

function AdminSectionContent() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="/dashboard"        element={<AdminDashboard />} />
        <Route path="/users"            element={<AdminUsers />} />
        <Route path="/transactions"     element={<AdminTransactions />} />
        <Route path="/manual-deposits"  element={<AdminManualDeposits />} />
        <Route path="/wallet-requests"  element={<AdminWalletRequests />} />
        <Route path="/countries"        element={<AdminCountries />} />
        <Route path="/exchange-rates"   element={<AdminExchangeRates />} />
        <Route path="/deposit-packages" element={<AdminDepositPackages />} />
        <Route path="/notifications"    element={<AdminNotifications />} />
        <Route path="/banners"          element={<AdminBanners />} />
        <Route path="/air-tickets"      element={<AdminAirTickets />} />
        <Route path="/visa-apps"        element={<AdminVisaApps />} />
        <Route path="/visa-services"    element={<AdminVisaServices />} />
        <Route path="/air-ticket-routes" element={<AdminAirTicketRoutes />} />
        <Route path="/min-balance"      element={<AdminMinBalance />} />
        <Route path="/support-chats"    element={<AdminSupportChats />} />
        <Route path="/group-chat"       element={<AdminGroupChat />} />
        <Route path="/intl-transfer"    element={<AdminIntlTransfer />} />
        <Route path="/support-contacts" element={<AdminSupportContacts />} />
        <Route path="/company-info"     element={<AdminCompanyInfo />} />
        <Route path="/about-us"         element={<AdminAboutUs />} />
        <Route path="/banks"            element={<AdminBanks />} />
        <Route path="/virtual-agents"   element={<AdminVirtualAgents />} />
        <Route path="/geo-restriction"  element={<AdminGeoRestriction />} />
        <Route path="/agent-kyc"        element={<AdminAgentKYC />} />
        <Route path="/management"       element={<AdminManagement />} />
        <Route path="/home-config"      element={<AdminHomeConfig />} />
        <Route path="*"                 element={<Navigate to="/admin" replace />} />
      </Routes>
    </Suspense>
  );
}

// ─────────────────────────────────────────────
// CUSTOMER APP
// ─────────────────────────────────────────────
const CustomerApp = memo(function CustomerApp() {
  const { status, user, checkAppState } = useAuth();
  const [locked, setLocked]             = useState(false);
  const [lockUser, setLockUser]         = useState(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  const isLoading = status === 'loading';

  // App Lock — check once after auth resolves
  const lockCheckedRef = useRef(false);
  useEffect(() => {
    if (isLoading) return;
    if (lockCheckedRef.current) return;
    lockCheckedRef.current = true;
    if (user?.pin && isSessionLocked()) {
      setLockUser(user);
      setLocked(true);
    } else {
      recordActivity();
    }
  }, [isLoading, user]);

  // Re-lock on background return
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (checkBackgroundLock() && user?.pin) { setLockUser(user); setLocked(true); }
      } else { recordActivity(); }
    };
    const onActivity = () => recordActivity();
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('click', onActivity);
    document.addEventListener('touchstart', onActivity);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('click', onActivity);
      document.removeEventListener('touchstart', onActivity);
    };
  }, [user]);

  // Loading timeout fallback (12s)
  useEffect(() => {
    if (!isLoading) { setLoadingTimeout(false); return; }
    const t = setTimeout(() => setLoadingTimeout(true), 12000);
    return () => clearTimeout(t);
  }, [isLoading]);

  // ── LOADING ──
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-5"
        style={{ background: 'linear-gradient(160deg,#0b3d2e 0%,#0f4d36 60%,#0a3828 100%)' }}>
        <div className="relative">
          <div className="w-20 h-20 rounded-[24px] flex items-center justify-center shadow-2xl"
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 20px 50px rgba(16,185,129,0.45)' }}>
            <span className="text-white font-black text-4xl" style={{ lineHeight: 1 }}>৳</span>
          </div>
          <div className="absolute inset-0 rounded-[24px] animate-ping opacity-20"
            style={{ border: '2px solid #10b981' }} />
        </div>
        <div className="text-center">
          <p className="text-white font-black text-xl tracking-tight">Money Tracker</p>
          <p className="text-white/40 text-xs mt-1">Secure Digital Banking</p>
        </div>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        {loadingTimeout && (
          <div className="flex flex-col items-center gap-3 mt-2">
            <p className="text-sm text-white/50">Connection is taking too long...</p>
            <button onClick={() => { setLoadingTimeout(false); checkAppState(); }}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── NOT AUTHENTICATED ──
  if (status === 'unauthenticated') return <LoginRedirect />;

  // ── USER NOT REGISTERED ──
  if (!user) return <UserNotRegisteredError />;

  // ── PIN LOCK SCREEN ──
  if (locked && lockUser) {
    return (
      <AppLockScreen
        user={lockUser}
        onUnlock={() => { recordActivity(); setLocked(false); }}
      />
    );
  }

  // ── MAIN ROUTES ──
  return (
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-forest rounded-full animate-spin" />
      </div>
    }>
      <Routes>
        <Route path="/"                          element={<Home />} />
        {/* All legacy/dead paths → home, no loops */}
        <Route path="/onboarding"  element={<Navigate to="/" replace />} />
        <Route path="/onb"         element={<Navigate to="/" replace />} />
        <Route path="/welcome"     element={<Navigate to="/" replace />} />
        <Route path="/login"       element={<Navigate to="/" replace />} />

        <Route path="/support"                   element={<SupportChat />} />
        <Route path="/support-center"            element={<Support />} />
        <Route path="/group-chat"                element={<GroupChat />} />
        <Route path="/add-money"                 element={<AddMoney />} />
        <Route path="/deposit-options/:countryId" element={<DepositOptions />} />
        <Route path="/history"                   element={<History />} />
        <Route path="/profile"                   element={<Profile />} />
        <Route path="/mobile-banking-transfer"   element={<MobileBankingTransfer />} />
        <Route path="/bank-transfer"             element={<BankTransferOptimized />} />
        <Route path="/wallet"                    element={<Wallet />} />
        <Route path="/exchange-rates"            element={<ExchangeRates />} />
        <Route path="/kyc"                       element={<KYC />} />
        <Route path="/air-ticket"                element={<AirTicket />} />
        <Route path="/manual-deposit"            element={<ManualDeposit />} />
        <Route path="/visa"                      element={<VisaApplication />} />
        <Route path="/pay-redirect"              element={<PayRedirect />} />
        <Route path="/intl-transfer"             element={<IntlTransfer />} />
        <Route path="/about"                     element={<AboutUs />} />
        <Route path="*"                          element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
});

// ─────────────────────────────────────────────
// ROOT ROUTER — unified auth for customer + admin
// ─────────────────────────────────────────────
const RootRouter = memo(function RootRouter() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientOptimized}>
        <DeepLinkHandler />
        <Routes>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/admin/*" element={<AdminSectionWithPIN />} />
          <Route path="/*" element={
            <GeoRestriction>
              <CustomerApp />
            </GeoRestriction>
          } />
        </Routes>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
});

function FirebaseSetupScreen() {
  const [config, setConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setConfig({
      ...config,
      [e.target.name]: e.target.value.trim()
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!config.apiKey || !config.projectId) {
      setError('API Key and Project ID are required.');
      return;
    }
    if (!config.apiKey.startsWith('AIzaSy')) {
      setError('Invalid Firebase API Key. It should start with "AIzaSy".');
      return;
    }
    
    const success = saveFirebaseConfig(config);
    if (success) {
      window.location.reload();
    } else {
      setError('Failed to save configuration. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#07241b] text-slate-100 p-6 overflow-y-auto z-[999999]">
      <div className="w-full max-w-md bg-[#0b3d2e] rounded-2xl p-6 border border-emerald-800 shadow-2xl my-auto">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-full bg-emerald-950 text-emerald-400 mb-3 border border-emerald-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Firebase Connection Setup</h2>
          <p className="text-xs text-slate-300 mt-2">
            দয়া করে আপনার ফায়ারবেস ক্রেডেনশিয়াল প্রদান করুন। এর মাধ্যমে আপনার অ্যান্ড্রয়েড অ্যাপটি ডেটাবেসের সাথে সংযুক্ত হবে।
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-lg font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">API Key *</label>
            <input
              type="text"
              name="apiKey"
              value={config.apiKey}
              onChange={handleChange}
              placeholder="AIzaSy..."
              className="w-full bg-[#051812] border border-emerald-900 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder-emerald-800/80 font-mono text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Project ID *</label>
            <input
              type="text"
              name="projectId"
              value={config.projectId}
              onChange={handleChange}
              placeholder="money-tracker-ef2f2"
              className="w-full bg-[#051812] border border-emerald-900 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder-emerald-800/80 font-mono text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Auth Domain</label>
              <input
                type="text"
                name="authDomain"
                value={config.authDomain}
                onChange={handleChange}
                placeholder="project.firebaseapp.com"
                className="w-full bg-[#051812] border border-emerald-900 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder-emerald-800/80 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Storage Bucket</label>
              <input
                type="text"
                name="storageBucket"
                value={config.storageBucket}
                onChange={handleChange}
                placeholder="project.appspot.com"
                className="w-full bg-[#051812] border border-emerald-900 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder-emerald-800/80 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Messaging Sender ID</label>
              <input
                type="text"
                name="messagingSenderId"
                value={config.messagingSenderId}
                onChange={handleChange}
                placeholder="1234567890"
                className="w-full bg-[#051812] border border-emerald-900 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder-emerald-800/80 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">App ID</label>
              <input
                type="text"
                name="appId"
                value={config.appId}
                onChange={handleChange}
                placeholder="1:1234:web:abcd"
                className="w-full bg-[#051812] border border-emerald-900 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder-emerald-800/80 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors mt-6 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
          >
            Save and Connect / সংরক্ষণ করুন
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-emerald-900 text-[10px] text-slate-400 space-y-1">
          <p className="font-semibold text-emerald-500 text-[11px]">How to get these values?</p>
          <p>1. Go to your <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-medium">Firebase Console</a></p>
          <p>2. Open Project Settings → General → Your apps</p>
          <p>3. Select your Web app configuration block and copy the keys.</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  if (!isFirebaseConfigured()) {
    return <FirebaseSetupScreen />;
  }

  return (
    <ErrorBoundary>
      <PreloadOptimization />
      <PWAInstallBanner />
      <OfflineDetector />
      <Router>
        <RootRouter />
      </Router>
    </ErrorBoundary>
  );
}

export default memo(App);