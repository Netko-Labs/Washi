import { createFileRoute } from '@tanstack/react-router'
import {
  sharedFileAllowed,
  sharedHistory,
  sharedPage,
  sharedQuery,
  sharedTable,
} from '@washi/service'
import { fileResponse } from '@/server/files'
import { NO_STORE, shareAskSchema, sharedWorkspace, shareFailure } from '@/server/share'

const MAX_ASK_BYTES = 16 * 1024

/**
 * A page's read-only link, with no session (D65). GET `<workspace>/<token>` is the page as the
 * link shows it, GET `<workspace>/<token>/file/<id>` an upload the page uses, POST
 * `<workspace>/<token>/ask` one question about a table the page reads.
 */
export const Route = createFileRoute('/api/share/$')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const [workspaceId = '', token = '', part, fileId] = (params._splat ?? '').split('/')
        const resolved = await sharedWorkspace(workspaceId)
        if (!resolved) return Response.json({ error: 'not found' }, { status: 404 })
        try {
          if (part === 'file' && fileId) {
            if (!sharedFileAllowed(resolved.workspace, token, fileId)) {
              return new Response(null, { status: 404 })
            }
            const found = await resolved.files.get(fileId)
            if (!found) return new Response(null, { status: 404 })
            // A link can be turned off: nothing it served may outlive it in a cache.
            return fileResponse(request, found, NO_STORE)
          }
          if (part) return Response.json({ error: 'not found' }, { status: 404 })
          return Response.json(sharedPage(resolved.workspace, token), { headers: NO_STORE })
        } catch (cause) {
          return shareFailure(cause)
        }
      },
      POST: async ({ request, params }) => {
        const [workspaceId = '', token = '', part] = (params._splat ?? '').split('/')
        if (part !== 'ask') return Response.json({ error: 'not found' }, { status: 404 })
        if (Number(request.headers.get('content-length') ?? 0) > MAX_ASK_BYTES) {
          return Response.json({ error: 'too large' }, { status: 413 })
        }
        const resolved = await sharedWorkspace(workspaceId)
        if (!resolved) return Response.json({ error: 'not found' }, { status: 404 })
        const ask = shareAskSchema.safeParse(await request.json().catch(() => null))
        if (!ask.success) return Response.json({ error: 'bad question' }, { status: 400 })
        try {
          const ws = resolved.workspace
          const answer =
            ask.data.kind === 'rows'
              ? sharedQuery(ws, token, ask.data.query)
              : ask.data.kind === 'history'
                ? sharedHistory(ws, token, ask.data.query)
                : sharedTable(ws, token, ask.data.name)
          return Response.json(answer, { headers: NO_STORE })
        } catch (cause) {
          return shareFailure(cause)
        }
      },
    },
  },
})
