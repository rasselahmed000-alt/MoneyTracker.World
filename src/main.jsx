// Unregister stale service workers in dev to prevent cached stale JS breaking React hooks
if (import.meta.env.DEV && 'serviceWorker' in navigator && window.location.protocol !== 'file:') {
  try {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.unregister());
    }).catch(() => {});
  } catch (e) {
    console.warn('Service worker not supported or disabled:', e);
  }
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initPerformanceOptimizations } from '@/lib/performance-config'

// Initialize performance system before React
initPerformanceOptimizations();

// Use concurrent rendering for better performance
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Register service worker only in production — dev SW caching stale React = hooks crash
if (!import.meta.env.DEV && 'serviceWorker' in navigator && window.location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker
        .register('./sw.js', { scope: './', updateViaCache: 'none' })
        .then(reg => {
          // Force update check on each load — prevents stale cached JS causing login loops
          reg.update().catch(() => {});
        })
        .catch(() => {});
    } catch (e) {
      console.warn('Service worker registration failed:', e);
    }
  });
}