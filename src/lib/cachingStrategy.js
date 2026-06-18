/**
 * P2 OPTIMIZATION: Caching strategy
 * - Reduces API calls
 * - Improves perceived performance
 * - Smart cache invalidation
 */

import React from 'react';

const CACHE_PREFIX = 'moneytrackerbd_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export class CacheManager {
  static set(key, data, ttl = DEFAULT_TTL) {
    try {
      const payload = {
        data,
        timestamp: Date.now(),
        expires: Date.now() + ttl,
      };
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(payload));
    } catch (err) {
      console.warn('Cache write failed:', err);
    }
  }

  static get(key) {
    try {
      const item = localStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!item) return null;

      const payload = JSON.parse(item);

      if (Date.now() > payload.expires) {
        this.delete(key);
        return null;
      }

      return payload.data;
    } catch {
      return null;
    }
  }

  static delete(key) {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  }

  static clear() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  static isExpired(key) {
    const item = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!item) return true;
    try {
      const payload = JSON.parse(item);
      return Date.now() > payload.expires;
    } catch {
      return true;
    }
  }
}

// Critical cache keys
export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  USER_BALANCE: 'user_balance',
  BANKS: 'banks_list',
  COUNTRIES: 'countries_list',
  EXCHANGE_RATES: 'exchange_rates',
  TRANSACTION_HISTORY: 'tx_history',
  ADMIN_USERS: 'admin_users',
  ADMIN_TRANSACTIONS: 'admin_transactions',
};

// Cache strategies
export function cacheUserProfile(user, ttl = 10 * 60 * 1000) {
  CacheManager.set(CACHE_KEYS.USER_PROFILE, user, ttl);
}

export function getCachedUserProfile() {
  return CacheManager.get(CACHE_KEYS.USER_PROFILE);
}

export function invalidateUserProfile() {
  CacheManager.delete(CACHE_KEYS.USER_PROFILE);
}

export function cacheBanks(banks, ttl = 30 * 60 * 1000) {
  CacheManager.set(CACHE_KEYS.BANKS, banks, ttl);
}

export function getCachedBanks() {
  return CacheManager.get(CACHE_KEYS.BANKS);
}

export function cacheCountries(countries, ttl = 30 * 60 * 1000) {
  CacheManager.set(CACHE_KEYS.COUNTRIES, countries, ttl);
}

export function getCachedCountries() {
  return CacheManager.get(CACHE_KEYS.COUNTRIES);
}

// Export React hook for cache-aware queries
export function useOptimizedQuery(key, fetcher, options = {}) {
  const { ttl = DEFAULT_TTL, cacheable = true } = options;
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const execute = async () => {
      // Check cache first
      if (cacheable) {
        const cached = CacheManager.get(key);
        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }
      }

      // Fetch if cache miss
      try {
        const result = await fetcher();
        if (cacheable) CacheManager.set(key, result, ttl);
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    execute();
  }, [key, fetcher, ttl, cacheable]);

  return { data, loading, error };
}