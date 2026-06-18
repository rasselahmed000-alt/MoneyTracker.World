import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AppShell from '../components/cellfin/AppShell';
import UniversalHeader from '@/components/cellfin/UniversalHeader';

export default function ExchangeRates() {
  const navigate = useNavigate();
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    base44.entities.ExchangeRate.filter({ is_active: true }, '-updated_date', 100)
      .then(setRates)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <AppShell header={
      <UniversalHeader
        title="Exchange Rates"
        subtitle="বর্তমান বিনিময় হার"
        rightAction={
          <button
            onClick={load}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <RefreshCw size={16} className={`text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />
    }>
      {/* Content */}

      <div className="px-4 py-5 space-y-3">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-2xl animate-pulse shadow-sm" />
          ))
        ) : rates.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No rates available</p>
          </div>
        ) : (
          rates.map((r) => (
            <div key={r.id}
              className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#e8f5e9,#c8e6c9)' }}>
                  <TrendingUp size={18} className="text-green-700" />
                </div>
                <div>
                  <p className="font-extrabold text-gray-800 text-sm">
                    1 {r.from_currency}
                  </p>
                  <p className="text-xs text-gray-400">→ {r.to_currency}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-lg text-green-700">৳ {r.rate}</p>
                <p className="text-[10px] text-gray-400">
                  Updated {new Date(r.updated_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </p>
              </div>
            </div>
          ))
        )}

        <p className="text-center text-[11px] text-gray-400 pt-2">
          * হার পরিবর্তন হতে পারে। সর্বশেষ হার Admin কর্তৃক আপডেট করা হয়।
        </p>
      </div>
    </AppShell>
  );
}