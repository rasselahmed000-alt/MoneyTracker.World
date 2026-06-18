import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

const LIVE_RATES = [
  { country: 'Saudi Arabia', flag: '🇸🇦', code: 'SAR', rate: 29.5, change: '+0.2%', color: '#10b981' },
  { country: 'UAE', flag: '🇦🇪', code: 'AED', rate: 30.1, change: '+0.1%', color: '#3b82f6' },
  { country: 'Malaysia', flag: '🇲🇾', code: 'MYR', rate: 24.2, change: '-0.3%', color: '#8b5cf6' },
  { country: 'UK', flag: '🇬🇧', code: 'GBP', rate: 140, change: '+0.5%', color: '#f59e0b' },
  { country: 'USA', flag: '🇺🇸', code: 'USD', rate: 110, change: '+0.1%', color: '#ef4444' },
  { country: 'Singapore', flag: '🇸🇬', code: 'SGD', rate: 82, change: '+0.2%', color: '#06b6d4' },
];

export default function LiveExchangeRates() {
  const scrollRef = useRef(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 px-4">
        <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
          <TrendingUp size={11} className="text-white" />
        </div>
        <p className="text-[11px] font-black text-gray-600 uppercase tracking-widest">Live Exchange Rates</p>
      </div>
      
      <div ref={scrollRef} className="flex gap-2.5 px-4 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {LIVE_RATES.map((rate, i) => (
          <motion.div
            key={rate.code}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex-shrink-0 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl">{rate.flag}</span>
              <span className="font-bold text-xs text-gray-700">{rate.code}</span>
            </div>
            <p className="text-sm font-black text-gray-900">৳{rate.rate}</p>
            <p className="text-[10px] font-semibold" style={{ color: rate.color }}>{rate.change}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}