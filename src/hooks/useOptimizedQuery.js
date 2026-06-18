import { useQuery } from '@tanstack/react-query';

/**
 * Optimized query hook with caching, deduplication, and instant fallback
 * - Caches results in memory for instant re-use
 * - Deduplicates simultaneous requests
 * - Returns cached data immediately without re-fetching
 * - Perfect for performance-critical data
 */
export function useOptimizedQuery(key, queryFn, options = {}) {
  return useQuery({
    queryKey: key,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
    ...options,
  });
}

/**
 * Pre-fetch data before user navigates to a page
 * Prevents loading delays when user actually needs the data
 */
export function usePrefetchQuery(queryClient, key, queryFn) {
  return async () => {
    if (!queryClient.getQueryData(key)) {
      await queryClient.prefetchQuery({
        queryKey: key,
        queryFn,
        staleTime: 5 * 60 * 1000,
      });
    }
  };
}