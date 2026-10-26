import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/platform/http/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // returning to the tab always revalidates
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
    },
  },
});
