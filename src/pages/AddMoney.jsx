import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, HandCoins, PackageOpen, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import AppShell from '../components/cellfin/AppShell';
import UniversalHeader from '@/components/cellfin/UniversalHeader';

export default function AddMoney() {
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [rates, setRates] = useState({});
  const [packages, setPackages] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [pkgLoading, setPkgLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(null);
  const userRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(u => { userRef.current = u; }).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [countriesData, ratesData] = await Promise.all([
          base44.entities.Country.filter({ is_active: true }),
          base44.entities.ExchangeRate.filter({ is_active: true }),
        ]);
        setCountries(countriesData || []);
        const rateMap = {};
        (ratesData || []).forEach(r => { rateMap[r.from_currency] = r.rate; });
        setRates(rateMap);
      } catch {
        setCountries([]);
        setRates({});
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    
    // Real-time sync on rate/country changes
    const unsubRates = base44.entities.ExchangeRate.subscribe((event) => {
      if (['create','update'].includes(event.type) && event.data?.is_active) {
        setRates(prev => ({ ...prev, [event.data.from_currency]: event.data.rate }));
      }
    });
    const unsubCountries = base44.entities.Country.subscribe((event) => {
      if (event.type === 'update' && event.data?.is_active !== false) {
        setCountries(prev => prev.map(c => c.id === event.id ? event.data : c));
      }
    });
    
    return () => { unsubRates(); unsubCountries(); };
  }, []);

  const loadPackages = async (country) => {
    setSelectedCountry(country);
    setPkgLoading(true);
    try {
      // Fetch ALL active packages and filter by country_id OR country_name (dual match for legacy data)
      const allPkgs = await base44.entities.DepositPackage.filter({ is_active: true }, 'amount', 200);
      const matched = (allPkgs || []).filter(p =>
        p.country_id === country.id || p.country_name === country.name
      );
      setPackages(prev => ({ ...prev, [country.id]: matched }));
    } catch {
      setPackages(prev => ({ ...prev, [country.id]: [] }));
    } finally {
      setPkgLoading(false);
    }
  };

  const handleDeposit = async (pkg) => {
    if (!pkg.redirect_url) {
      alert('এই প্যাকেজের জন্য পেমেন্ট URL কনফিগার করা হয়নি। Admin-এ যোগাযোগ করুন।');
      return;
    }
    setRedirecting(pkg.id);
    const u = userRef.current;
    try {
      // 1. Increment click count
      await base44.entities.DepositPackage.update(pkg.id, { click_count: (pkg.click_count || 0) + 1 });
      // 2. Create pending deposit record with BDT conversion
      if (u) {
        const currency = pkg.currency || selectedCountry.currency;
        const bdtAmount = (pkg.amount * (rates[currency] || 1));
        await base44.entities.Transaction.create({
          user_id: u.id,
          user_email: u.email,
          type: 'deposit',
          amount: Math.round(bdtAmount),
          currency: 'BDT',
          status: 'pending',
          tx_id: `DEP-${Date.now()}`,
          description: `Deposit from ${selectedCountry.name} (${pkg.amount} ${currency} = ৳${Math.round(bdtAmount)} BDT)`,
        });
      }
      // 3. Open deposit URL directly in external browser
      window.location.href = pkg.redirect_url;
    } catch (err) {
      console.error('Deposit init error:', err);
      setRedirecting(null);
    }
  };

  const bdtEquivalent = (amount, currency) => {
    const rate = rates[currency];
    if (!rate) return null;
    return (amount * rate).toLocaleString('en-BD', { maximumFractionDigits: 0 });
  };

  // Always read from state — cache is refreshed on every country click
  const currentPkgs = selectedCountry ? (packages[selectedCountry.id] || []) : [];

  return (
    <AppShell header={
      <UniversalHeader
        title="Add Money"
        subtitle={selectedCountry ? `${selectedCountry.flag_emoji} ${selectedCountry.name}` : 'Select country to deposit'}
        showBack={!selectedCountry}
        onBack={() => selectedCountry ? setSelectedCountry(null) : navigate(-1)}
      />
    }>
      <div className="p-4">

        {/* Manual Deposit Banner — only on country selection screen */}
        {!selectedCountry && (
          <button onClick={() => navigate('/manual-deposit')}
            className="w-full mb-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 flex items-center gap-3 shadow-md active:scale-98 transition-transform">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <HandCoins size={22} className="text-white" />
            </div>
            <div className="flex-1 text-left">
            <p className="text-white font-extrabold text-sm">Manual Deposit</p>
            <p className="text-white/70 text-xs">Bank / Mobile Banking দিয়ে জমা করুন</p>
            </div>
            <ArrowLeft size={16} className="text-white/60 rotate-180" />
          </button>
        )}

        {!selectedCountry ? (
          /* Country list */
          <>
            {loading ? (
              <div className="space-y-2">
                {Array(6).fill(0).map((_, i) => <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-20 border border-border" />)}
              </div>
            ) : countries.length === 0 ? (
              <div className="text-center py-16">
                <PackageOpen size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-400 font-medium">কোনো দেশ পাওয়া যায়নি।</p>
                <p className="text-gray-300 text-xs mt-1">Admin প্যানেল থেকে দেশ যোগ করুন।</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {countries.map((c, i) => {
                  const rate = rates[c.currency];
                  return (
                    <motion.button
                      key={c.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => loadPackages(c)}
                      className="w-full bg-white rounded-2xl p-4 shadow-sm border border-border flex items-center gap-3 hover:shadow-md hover:border-gold/30 transition-all"
                    >
                      <span className="text-3xl shrink-0">{c.flag_emoji || '🌍'}</span>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-bold text-sm text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.currency}
                          {rate && <span className="text-forest font-semibold"> · 1 {c.currency} = ৳{rate}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-forest text-gold px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">
                        <Zap size={12} />
                        Deposit
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* Packages for selected country */
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2 mb-4">
              <span className="text-amber-500 mt-0.5 text-sm">🔒</span>
              <p className="text-amber-700 text-xs font-medium">Secure payment. Your transaction is protected and encrypted.</p>
            </div>

            {pkgLoading ? (
              <div className="space-y-3">
                {Array(3).fill(0).map((_, i) => <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-24 border border-border" />)}
              </div>
            ) : currentPkgs.length === 0 ? (
              <div className="text-center py-16">
                <PackageOpen size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-400 font-medium">এই দেশের জন্য কোনো প্যাকেজ নেই।</p>
                <p className="text-gray-300 text-xs mt-1">Admin প্যানেল থেকে প্যাকেজ যোগ করুন।</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentPkgs.map((pkg, i) => {
                  const bdt = bdtEquivalent(pkg.amount, pkg.currency || selectedCountry.currency);
                  return (
                    <motion.div
                      key={pkg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
                    >
                      <div className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-1.5">
                            <p className="text-xl font-extrabold text-forest">{pkg.amount}</p>
                            <span className="text-sm font-bold text-muted-foreground">{pkg.currency || selectedCountry.currency}</span>
                          </div>
                          {bdt && (
                            <p className="text-xs text-emerald-600 font-semibold mt-0.5">= ৳{bdt} BDT</p>
                          )}
                          <p className="text-[10px] text-muted-foreground">Instant Processing</p>
                        </div>
                        <button
                          onClick={() => handleDeposit(pkg)}
                          disabled={redirecting === pkg.id}
                          className="bg-forest text-gold px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 active:scale-95 transition-transform disabled:opacity-70 shrink-0"
                        >
                          {redirecting === pkg.id ? (
                            <span className="flex items-center gap-1.5">
                              <span className="w-3.5 h-3.5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                              Processing...
                            </span>
                          ) : (
                            <><Zap size={14} /> Deposit Now</>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}