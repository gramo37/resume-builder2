import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './types'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          return false
        }

        return failureCount < 1
      },
    },
    mutations: {
      retry: false,
    },
  },
})
