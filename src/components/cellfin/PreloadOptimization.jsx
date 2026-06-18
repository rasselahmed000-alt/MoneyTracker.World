import { useEffect } from 'react';
import { preloadResource, prefetchResource } from '@/lib/performance-utils';

/**
 * Preload critical pages and assets
 * Runs on app startup to pre-cache important resources
 */
// Critical logos — preload immediately on app start
const CRITICAL_IMAGES = [
  'https://media.base44.com/images/public/69fdabac102db66d741fa29f/87535a6b9_1780440626277.png', // bKash
  'https://media.base44.com/images/public/69fdabac102db66d741fa29f/30d2abd72_1780440344814.png',  // Nagad
  'https://media.base44.com/images/public/69fdabac102db66d741fa29f/6344c9b81_IMG_20260603_045402_210.png', // Rocket
  'https://media.base44.com/images/public/69fdabac102db66d741fa29f/5f387e2c8_1780440709009.png',  // Bank Transfer
  'https://media.base44.com/images/public/69fdabac102db66d741fa29f/3bc9a9e9f_file_0000000052a071fabb0e565ce9549ea9.png', // AppLockScreen Logo
];

// Preload into browser memory at startup
CRITICAL_IMAGES.forEach(src => {
  const img = new Image();
  img.src = src;
});

export default function PreloadOptimization() {
  useEffect(() => {
    // Inject <link rel="preload"> for each logo so browser fetches them at highest priority
    CRITICAL_IMAGES.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = href;
      link.fetchPriority = 'high';
      document.head.appendChild(link);
    });

    // Preload favicon
    preloadResource('/favicon.ico', 'image');
    
    // Prefetch next likely pages
    prefetchResource('/pages/Home');
    prefetchResource('/pages/AddMoney');
    prefetchResource('/pages/MobileBanking');
    prefetchResource('/pages/BankTransfer');
    
    // Preconnect to API + media CDN
    ['https://api.base44.com', 'https://media.base44.com'].forEach(origin => {
      const preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = origin;
      document.head.appendChild(preconnect);
    });
  }, []);

  return null;
}