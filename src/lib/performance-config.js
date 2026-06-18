/**
 * Global Performance Configuration
 * Initialize all optimization systems
 */

export function initPerformanceOptimizations() {
  // 1. Reduce motion for users who prefer it
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.scrollBehavior = 'auto';
  }

  // 2. Network status aware
  let isOnline = navigator.onLine;
  window.addEventListener('online', () => { isOnline = true; });
  window.addEventListener('offline', () => { isOnline = false; });

  // 3. Disable animations on slow connections
  if ('connection' in navigator) {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === '3g')) {
      document.documentElement.classList.add('reduced-motion');
    }
  }

  // 4. Enable resource hints
  enableResourceHints();

  // 5. Schedule non-critical work
  scheduleIdleWork();
}

function enableResourceHints() {
  // Preconnect to CDN
  const preconnect = ['https://media.base44.com', 'https://api.base44.com'];
  preconnect.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

function scheduleIdleWork() {
  // Warm up cache for likely next pages
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Pre-warm critical API endpoints
      if ('fetch' in window) {
        fetch('/api/banks', { method: 'GET', priority: 'low' }).catch(() => {});
      }
    });
  }
}

// Export online status getter
export function isNetworkOnline() {
  return navigator.onLine;
}

// Export connection type
export function getConnectionType() {
  if ('connection' in navigator) {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return conn?.effectiveType || '4g';
  }
  return '4g';
}