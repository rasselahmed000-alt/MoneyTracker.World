import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch just because window gets focus (tab switch / minimize)
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // Cache data for 5 minutes, keep in memory for 10 minutes
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      retryDelay: 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});