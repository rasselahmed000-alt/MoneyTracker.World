import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { isInNativeApp, openPaymentGateway } from '@/lib/deepLinkHandler';

export default function PayRedirect() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [countdown, setCountdown] = useState(1);
  const [isInApp, setIsInApp] = useState(false);

  useEffect(() => {
    // Detect if running in native app webview
    const userAgent = navigator.userAgent;
    const inApp = /MoneyTrackerApp|moneytracker|webview/i.test(userAgent) ||
                  window.moneyTrackerApp !== undefined ||
                  (window.Android && window.Android.openPaymentGateway !== undefined);
    setIsInApp(inApp);

    const params = new URLSearchParams(window.location.search);
    const target = params.get('url');
    if (!target) { navigate('/add-money'); return; }
    setUrl(target);

    // Immediate redirect with proper method for app vs web
    const redirectTimer = setTimeout(() => {
      handleRedirect(target);
    }, 800);

    return () => clearTimeout(redirectTimer);
  }, []);

  const handleRedirect = (target) => {
    if (isInNativeApp()) {
      openPaymentGateway(target);
    } else {
      window.location.href = target;
    }
  };

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-background font-inter flex flex-col items-center justify-center px-6">
      <div className="bg-white rounded-3xl shadow-xl border border-border p-8 w-full text-center">
        {/* Animated loading */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-forest/10 flex items-center justify-center relative">
          <div className="absolute inset-0 rounded-full border-4 border-forest/20 border-t-forest animate-spin" />
          <Zap size={28} className="text-forest" />
        </div>

        <h2 className="text-xl font-extrabold text-gray-800 mb-2">Payment Processing</h2>
        <p className="text-gray-500 text-sm mb-6">Redirecting to secure payment gateway...</p>

        {/* Countdown */}
        <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-forest text-gold flex items-center justify-center text-2xl font-extrabold">
          {countdown}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-6">
          <p className="text-amber-700 text-xs font-medium">🔒 আপনাকে secure payment page-এ নিয়ে যাওয়া হচ্ছে।</p>
        </div>

        {/* Manual button if auto-redirect fails */}
        {url && (
          <a
            href={url}
            className="block w-full bg-forest text-gold py-3.5 rounded-2xl font-extrabold text-sm text-center"
          >
            ⚡ এখনই পেমেন্ট করুন
          </a>
        )}
      </div>
    </div>
  );
}