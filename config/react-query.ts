import { QueryClientProvider, QueryClient } from '@tanstack/react-query';


export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      // notifyOnChangeProps: 'tracked',
      refetchOnWindowFocus: false,
    },
  },
})
