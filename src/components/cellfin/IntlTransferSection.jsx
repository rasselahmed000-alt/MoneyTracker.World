import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Module-level cache — survives navigation, fetched only once per session
let _intlCountriesCache = null;
let _intlCountriesFetching = null;

export default function IntlTransferSection() {
  const navigate = useNavigate();
  const [countries, setCountries] = useState(_intlCountriesCache || []);
  const [loading, setLoading] = useState(!_intlCountriesCache);

  useEffect(() => {
    if (_intlCountriesCache) { setCountries(_intlCountriesCache); setLoading(false); return; }
    if (!_intlCountriesFetching) {
      _intlCountriesFetching = base44.entities.IntlCountry.list('sort_order', 20)
        .then(ctrs => { _intlCountriesCache = (ctrs || []).filter(c => c.is_active); return _intlCountriesCache; })
        .catch(() => { _intlCountriesCache = []; return []; });
    }
    _intlCountriesFetching.then(ctrs => { setCountries(ctrs); setLoading(false); });
  }, []);

  if (!loading && countries.length === 0) return null;

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Globe size={11} className="text-emerald-600" />
          </div>
          <p className="text-[12px] font-black text-gray-800">International Transfer</p>
        </div>
        <p className="text-[10px] text-gray-400 font-semibold">Send Abroad</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-3xl animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          {countries.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileTap={{ scale: 0.92 }}
              whileHover={{ y: -2 }}
              onClick={() => navigate(`/intl-transfer?country=${c.id}`)}
              className="relative overflow-hidden rounded-3xl flex flex-col items-center justify-center gap-1.5 py-4 px-2 border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all"
              style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}
            >
              <motion.span 
                className="text-4xl leading-none"
                whileHover={{ scale: 1.1 }}
              >
                {c.flag_emoji}
              </motion.span>
              <span className="text-[11px] font-black text-gray-700 text-center leading-tight">{c.name}</span>
              <div className="flex items-center gap-0.5">
                <span className="text-[8px] text-emerald-600 font-bold">{c.currency_code}</span>
                <ChevronRight size={7} className="text-gray-300" />
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}