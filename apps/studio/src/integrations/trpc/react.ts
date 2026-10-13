import { createTRPCContext } from '@trpc/tanstack-react-query'
import type { AppRouter } from '@washi/trpc/client'

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>()
