/**
 * Performance monitoring & optimization utilities
 * Tracks rendering, API calls, and memory usage
 */

// Simple cache factory with TTL support
export function createCache(ttl = 60000) {
  const cache = new Map();
  return {
    get(key) {
      const entry = cache.get(key);
      if (!entry) return null;
      if (Date.now() - entry.timestamp > ttl) {
        cache.delete(key);
        return null;
      }
      return entry.data;
    },
    set(key, data) {
      cache.set(key, { data, timestamp: Date.now() });
    },
    clear() {
      cache.clear();
    },
  };
}

// Debounce function to prevent excessive re-renders
export function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Throttle function for scroll/resize events
export function throttle(fn, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Request deduplication — prevent duplicate API calls within same timeframe
const pendingRequests = new Map();

export function deduplicateRequest(key, requestFn) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = Promise.resolve(requestFn()).finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

// Request memoization cache
const memoCache = new Map();

export function memoizeRequest(key, requestFn, ttl = 60000) {
  const cached = memoCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return Promise.resolve(cached.data);
  }

  return Promise.resolve(requestFn()).then(data => {
    memoCache.set(key, { data, timestamp: Date.now() });
    return data;
  });
}

// Lazy load images with intersection observer
export function observeLazyImages() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '50px' });

    document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
  }
}

// Connection-aware image optimization
export function getOptimizedImageUrl(url, width = 800) {
  if (!url || typeof url !== 'string') return '';
  
  // Use original for critical images, compress others
  if (url.includes('logo') || url.includes('bank')) {
    return url; // Banks logos should not be compressed
  }
  
  // Return WebP if modern browser, else original
  if (url.includes('?')) {
    return `${url}&w=${width}&fm=webp`;
  }
  return `${url}?w=${width}&fm=webp`;
}

// Memory-efficient batch processing
export function processBatch(items, batchSize = 50, processor) {
  return new Promise((resolve) => {
    let index = 0;
    
    const processChunk = () => {
      const chunk = items.slice(index, index + batchSize);
      chunk.forEach(processor);
      index += batchSize;
      
      if (index < items.length) {
        requestIdleCallback(processChunk);
      } else {
        resolve();
      }
    };
    
    if ('requestIdleCallback' in window) {
      requestIdleCallback(processChunk);
    } else {
      processChunk();
    }
  });
}

// Analytics batching — reduce API calls
const analyticsBatch = [];
let analyticsTimer = null;

export function trackEvent(eventName, properties = {}) {
  analyticsBatch.push({ eventName, properties, timestamp: Date.now() });
  
  if (analyticsTimer) clearTimeout(analyticsTimer);
  analyticsTimer = setTimeout(() => {
    if (analyticsBatch.length > 0) {
      console.log('[Analytics Batch]', analyticsBatch);
      analyticsBatch.length = 0;
    }
  }, 5000);
}

// Preload a resource into browser memory
export function preloadResource(href, as = 'fetch') {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = href;
  link.fetchPriority = 'high';
  document.head.appendChild(link);
}

// Prefetch a resource for later use
export function prefetchResource(href) {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

// Simple performance metric logger
export const metrics = {
  pageLoadStart: Date.now(),
  apiCallCount: 0,
  rerenderCount: 0,

  recordApiCall(endpoint) {
    this.apiCallCount++;
    if (this.apiCallCount % 10 === 0) {
      console.log(`[Performance] API calls: ${this.apiCallCount}`);
    }
  },

  recordRerender(componentName) {
    this.rerenderCount++;
    if (this.rerenderCount % 20 === 0) {
      const elapsed = Date.now() - this.pageLoadStart;
      console.log(`[Performance] Page load: ${elapsed}ms, Rerenders: ${this.rerenderCount}`);
    }
  },
};