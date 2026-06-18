import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Zap, PackageOpen, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import AppShell from '../components/cellfin/AppShell';
import UniversalHeader from '@/components/cellfin/UniversalHeader';

export default function DepositOptions() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { countryId } = useParams();
  const country = state?.country;
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!country) {
      navigate('/add-money');
      return;
    }

    setLoading(true);
    base44.entities.DepositPackage.filter({ country_id: countryId, is_active: true })
      .then((data) => {
        setPackages(data || []);
      })
      .catch(() => {
        setPackages([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [countryId]);

  const handleDeposit = async (pkg) => {
    setError(null);
    
    if (!pkg.redirect_url || pkg.redirect_url.trim().length === 0) {
      setError('Payment link is not configured. Please contact support.');
      return;
    }

    // Update click count (non-blocking)
    try {
      await base44.entities.DepositPackage.update(pkg.id, { click_count: (pkg.click_count || 0) + 1 });
    } catch (err) {
      console.warn('Click count update failed:', err.message);
    }

    // Open external browser directly
    window.open(pkg.redirect_url, '_blank');
  };

  return (
    <AppShell header={
      <UniversalHeader
        title={country?.name || 'Deposit'}
        subtitle={`${country?.flag_emoji || ''} Select deposit amount`}
        rightAction={<span className="text-xs font-bold px-2 py-1 rounded-full bg-white/20 text-white">{country?.currency}</span>}
      />
    }>
      <div className="p-5 space-y-3">
        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2"
            >
              <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-700 text-xs font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2">
          <span className="text-amber-500 mt-0.5">🔒</span>
          <p className="text-amber-700 text-xs font-medium">Secure payment. Your transaction is protected and encrypted.</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-20 border border-border" />)}
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-16">
            <PackageOpen size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 font-medium">এই দেশের জন্য কোনো প্যাকেজ নেই।</p>
            <p className="text-gray-300 text-xs mt-1">Admin প্যানেল থেকে প্যাকেজ যোগ করুন।</p>
          </div>
        ) : (
          packages.map((pkg, i) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
            >
              <div className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-extrabold text-forest">{pkg.amount} <span className="text-base font-bold text-muted-foreground">{pkg.currency}</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">Instant Processing</p>
                </div>
                <button
                  onClick={() => handleDeposit(pkg)}
                  className="bg-forest text-gold px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform"
                >
                  <Zap size={16} /> Deposit Now
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </AppShell>
  );
}