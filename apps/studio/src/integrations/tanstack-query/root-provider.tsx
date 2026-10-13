import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { api, TRPCProvider } from '@/integrations/trpc'
import type { QueryProviderProps } from './lib'

let clientQueryClient: QueryClient | undefined

/** One client per browser; on the server a fresh one per router (per request). */
function getQueryClient() {
  if (typeof window === 'undefined') return new QueryClient()
  clientQueryClient ??= new QueryClient()
  return clientQueryClient
}

/** Called once by `getRouter`; the shell reuses the router's context, never calls this again. */
export function getContext() {
  return { queryClient: getQueryClient() }
}

export function Provider({ children, queryClient }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={api} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  )
}
