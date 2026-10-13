import { createFileRoute } from '@tanstack/react-router'
import { washiRuntime } from '@/server/runtime'

/** Sign-in, sign-up, organizations and invitations: Better Auth behind the control plane. */
async function handle(request: Request): Promise<Response> {
  const { runtime } = await washiRuntime()
  return (await runtime.control.handle(request)) ?? new Response('not found', { status: 404 })
}

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
})
