/**
 * Optimized Query Client Configuration
 * Reduced polling, smart staling, connection-aware
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClientOptimized = new QueryClient({
  defaultOptions: {
    queries: {
      // Aggressive caching for stable data
      staleTime: 5 * 60 * 1000, // 5 min
      gcTime: 30 * 60 * 1000, // 30 min (formerly cacheTime)
      
      // Reduce refetches
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'stale',
      refetchOnMount: 'stale',
      
      // Smart retry with exponential backoff
      retry: (failureCount) => failureCount < 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Network-aware polling
      refetchInterval: 0,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Prefetch critical data on app load
export function prefetchCriticalData(queryClient, base44) {
  // Pre-fetch user profile
  queryClient.prefetchQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  // Pre-fetch active countries
  queryClient.prefetchQuery({
    queryKey: ['countries', 'active'],
    queryFn: () => base44.entities.Country.filter({ is_active: true }),
    staleTime: 30 * 60 * 1000, // 30 min for static data
  });
}