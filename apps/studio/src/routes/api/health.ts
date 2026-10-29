import { createFileRoute } from '@tanstack/react-router'
import { isDraining } from '@/server/draining'
import { washiRuntime } from '@/server/runtime'

// Coolify and the proxy read the status code. A runtime that failed to boot answers 503, not a
// hang; so does a stopping one, which the proxy then stops routing to while it still serves.
export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        if (isDraining()) return Response.json({ ok: false, draining: true }, { status: 503 })
        try {
          const { runtime } = await washiRuntime()
          return Response.json({ ok: true, mode: runtime.mode })
        } catch {
          return Response.json({ ok: false }, { status: 503 })
        }
      },
    },
  },
})
