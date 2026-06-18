import { QueryClient } from '@tanstack/react-query';
import { createCache } from './performance-utils';

// Aggressive caching strategy for low-end devices
const apiCache = createCache(10 * 60 * 1000); // 10 minute TTL

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      
      // Keep previous data while refetching
      keepPreviousData: true,
      
      // Retry failed requests once
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Don't refetch on window focus (reduce unnecessary requests)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Custom hook for cached API calls
export const useOptimizedQuery = (queryKey, queryFn, options = {}) => {
  return {
    ...queryClientInstance.useQuery({
      queryKey,
      queryFn: async () => {
        const cacheKey = JSON.stringify(queryKey);
        const cached = apiCache.get(cacheKey);
        if (cached) return cached;
        
        const data = await queryFn();
        apiCache.set(cacheKey, data);
        return data;
      },
      ...options,
    }),
  };
};

// Clear cache on demand
export const clearQueryCache = () => {
  apiCache.clear();
  queryClientInstance.clear();
};