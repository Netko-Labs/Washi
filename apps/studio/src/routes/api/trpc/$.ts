import { createFileRoute } from '@tanstack/react-router'
import { appRouter, createTRPCHttpHandler } from '@washi/trpc'
import { createRequestContext, edgeLogger, trustedOrigins } from '@/server/runtime'

const handle = createTRPCHttpHandler({
  router: appRouter,
  endpoint: '/api/trpc',
  createContext: createRequestContext,
  trustedOrigins: trustedOrigins(),
  logger: edgeLogger,
})

export const Route = createFileRoute('/api/trpc/$')({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
})
