import type { TRPCClient } from '@trpc/client'
import type { AppRouter } from '@washi/trpc/client'

export type WashiClient = TRPCClient<AppRouter>

export interface HostOptions {
  client: WashiClient
  place: string
}
