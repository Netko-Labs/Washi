import { createFileRoute } from '@tanstack/react-router'
import { suggestionAskSchema } from '@washi/domain'
import {
  sharedFileAllowed,
  sharedHistory,
  sharedPage,
  sharedQuery,
  sharedRequested,
  sharedTable,
  sharedWritable,
  suggestRow,
} from '@washi/service'
import { fileResponse } from '@/server/files'
import { washiRuntime } from '@/server/runtime'
import {
  NO_STORE,
  shareAskSchema,
  sharedWorkspace,
  shareFailure,
  visitorHash,
} from '@/server/share'

const MAX_ASK_BYTES = 16 * 1024
const MAX_SUGGEST_BYTES = 64 * 1024

/**
 * A page's read-only link, with no session (D65). GET `<workspace>/<token>` is the page as the
 * link shows it, GET `<workspace>/<token>/file/<id>` an upload the page uses, POST
 * `<workspace>/<token>/ask` one question about a table the page reads, and POST
 * `<workspace>/<token>/suggest` a visitor's row, kept for a member to approve (D120).
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
        if (part !== 'ask' && part !== 'suggest') {
          return Response.json({ error: 'not found' }, { status: 404 })
        }
        const cap = part === 'suggest' ? MAX_SUGGEST_BYTES : MAX_ASK_BYTES
        if (Number(request.headers.get('content-length') ?? 0) > cap) {
          return Response.json({ error: 'too large' }, { status: 413 })
        }
        const resolved = await sharedWorkspace(workspaceId)
        if (!resolved) return Response.json({ error: 'not found' }, { status: 404 })
        const body = await request.json().catch(() => null)
        if (part === 'suggest') {
          const suggestion = suggestionAskSchema.safeParse(body)
          if (!suggestion.success) {
            return Response.json(
              { error: 'This could not be sent — check your name, email and fields.' },
              { status: 400 },
            )
          }
          try {
            const ipHash = visitorHash(request, workspaceId)
            const sent = suggestRow(resolved.workspace, token, suggestion.data, ipHash)
            if (sent.id) {
              const { runtime } = await washiRuntime()
              runtime.events.emit('workspaceChanged', { workspaceId, kind: 'data', id: null })
            }
            return Response.json({ ok: true }, { headers: NO_STORE })
          } catch (cause) {
            return shareFailure(cause)
          }
        }
        const ask = shareAskSchema.safeParse(body)
        if (!ask.success) return Response.json({ error: 'bad question' }, { status: 400 })
        try {
          const ws = resolved.workspace
          const { data } = ask
          const answer =
            data.kind === 'rows'
              ? sharedQuery(ws, token, data.query)
              : data.kind === 'history'
                ? sharedHistory(ws, token, data.query)
                : data.kind === 'requested'
                  ? sharedRequested(ws, token, data.ask)
                  : data.kind === 'writable'
                    ? sharedWritable(ws, token, data.name)
                    : sharedTable(ws, token, data.name)
          return Response.json(answer, { headers: NO_STORE })
        } catch (cause) {
          return shareFailure(cause)
        }
      },
    },
  },
})
