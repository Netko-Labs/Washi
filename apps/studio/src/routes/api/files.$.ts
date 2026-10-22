import { createFileRoute } from '@tanstack/react-router'
import { bodyTooLarge, fileLimits, lengthMissing, workspaceFor } from '@/server/files'

/**
 * One route, two verbs. POST `/api/files` takes multipart in and answers `{ id, name, mime,
 * size }`; GET `/api/files/<id>` hands a member the bytes. Ids never repeat, so a browser may
 * keep one for a year.
 */
export const Route = createFileRoute('/api/files/$')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const resolved = await workspaceFor(request)
        if (resolved instanceof Response) return resolved
        if (lengthMissing(request))
          return Response.json({ error: 'length required' }, { status: 411 })
        if (bodyTooLarge(request)) return Response.json({ error: 'up to 5 MB' }, { status: 413 })
        const form = await request.formData().catch(() => null)
        const file = form?.get('file')
        if (!(file instanceof File)) return Response.json({ error: 'no file' }, { status: 400 })
        const refusal = fileLimits(file)
        if (refusal) return Response.json({ error: refusal }, { status: 413 })
        const stored = await resolved.files.put({
          name: file.name,
          mime: file.type,
          bytes: new Uint8Array(await file.arrayBuffer()),
        })
        return Response.json(stored, { status: 201 })
      },
      GET: async ({ request, params }) => {
        const resolved = await workspaceFor(request)
        if (resolved instanceof Response) return resolved
        const found = await resolved.files.get(params._splat ?? '')
        if (!found) return new Response(null, { status: 404 })
        return new Response(found.bytes.slice(), {
          headers: {
            'content-type': found.file.mime,
            'content-length': String(found.bytes.byteLength),
            'cache-control': 'private, max-age=31536000, immutable',
          },
        })
      },
    },
  },
})
