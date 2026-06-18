import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

// Module-level cache
let _bannersCache = null;
let _bannersFetching = null;

export default function DynamicBannerCarousel() {
  const [banners, setBanners] = useState(_bannersCache || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(!_bannersCache);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (_bannersCache) { setBanners(_bannersCache); setLoading(false); return; }
    if (!_bannersFetching) {
      _bannersFetching = base44.entities.Banner.list('sort_order', 20)
        .then(data => { _bannersCache = (data || []).filter(b => b.is_active); return _bannersCache; })
        .catch(() => { _bannersCache = []; return []; });
    }
    _bannersFetching.then(data => { setBanners(data); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!banners.length) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % banners.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-40 rounded-3xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse shadow-lg" />
        <div className="flex gap-2 justify-center">
          {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-slate-200 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!banners.length) return null;

  const banner = banners[currentIndex];

  return (
    <div className="space-y-3.5">
      {/* Banner Carousel */}
      <div className="relative overflow-hidden rounded-3xl shadow-xl h-44 bg-gradient-to-br from-emerald-50 to-slate-100">
        <AnimatePresence mode="popLayout">
          <motion.a
            key={banner.id}
            href={banner.link_url || '#'}
            target={banner.link_url ? '_blank' : undefined}
            rel={banner.link_url ? 'noopener noreferrer' : undefined}
            initial={{ opacity: 0, x: direction === 1 ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction === 1 ? -100 : 100 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="block w-full h-full relative bg-cover bg-center group cursor-pointer"
          >
            {banner.image_url ? (
              <img
                src={banner.image_url}
                alt={banner.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #0b7a3e 0%, #1db954 100%)',
                }}
              >
                <p className="text-center font-bold text-white text-lg">{banner.title}</p>
              </div>
            )}
          </motion.a>
        </AnimatePresence>


      </div>


    </div>
  );
}