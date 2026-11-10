import { createFileRoute } from '@tanstack/react-router'
import { answerUpload } from '@washi/mcp'
import { washiRuntime } from '@/server/runtime'

/**
 * PUT `/api/uploads/<ticket>`: the bytes an agent's `file_upload_url` promised (D135), sent with
 * `curl -T` — no session and no token, the ticket in the path is the whole permission: one file,
 * one size, one workspace, ten minutes, once.
 */
export const Route = createFileRoute('/api/uploads/$ticket')({
  server: {
    handlers: {
      PUT: async ({ request, params }) => {
        const { runtime } = await washiRuntime()
        return answerUpload(request, params.ticket, async ({ workspaceId, actorId }) => {
          // The ticket's member must still be one: leaving the workspace ends what they started.
          if (!(await runtime.control.authorize(actorId, workspaceId))) return null
          const resolved = runtime.resolve(workspaceId)
          return { ws: resolved.workspace, files: resolved.files }
        })
      },
    },
  },
})
