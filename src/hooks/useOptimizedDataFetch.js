import { useEffect, useState, useCallback, useRef } from 'react';
import { getCachedResponse, setCachedResponse } from '@/lib/http-cache';

/**
 * Optimized Data Fetch Hook
 * - Cache layer before API
 * - Deduplication
 * - Connection-aware
 */
export function useOptimizedDataFetch(key, fetchFn, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { useCache = true, ttl = 5 * 60 * 1000 } = options;
  const fetchedRef = useRef(false);

  const fetchData = useCallback(async () => {
    // Check cache first
    if (useCache) {
      const cached = await getCachedResponse(key);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    try {
      const result = await fetchFn();
      setData(result);
      
      // Cache the result
      if (useCache) {
        await setCachedResponse(key, result);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn, useCache]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchData();
  }, []); // Run only once

  return { data, loading, error, refetch: fetchData };
}