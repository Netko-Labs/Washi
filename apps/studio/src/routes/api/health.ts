import { createFileRoute } from '@tanstack/react-router'
import { washiRuntime } from '@/server/runtime'

// Coolify reads the status code. A runtime that failed to boot answers 503, not a hang.
export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
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
