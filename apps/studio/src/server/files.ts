import { byteRange, isInlineType, UPLOAD_MAX_BYTES, uploadRefusal } from '@washi/domain'
import { createRequestContext, washiRuntime } from '@/server/runtime'

/** Multipart framing on top of the file itself. */
const BODY_SLACK = 16 * 1024

/** The same gate as a workspace procedure, for a route that carries bytes instead of JSON. */
export async function workspaceFor(request: Request) {
  const ctx = await createRequestContext({ req: request })
  if (ctx.mode === 'hosted' && !ctx.actorId) {
    return Response.json({ error: 'sign in' }, { status: 401 })
  }
  const workspaceId = new URL(request.url).searchParams.get('workspace') ?? ctx.workspaceId
  const allowed = await ctx.runtime.control.authorize(ctx.actorId, workspaceId)
  if (!allowed) return Response.json({ error: 'unknown workspace' }, { status: 404 })
  const { runtime } = await washiRuntime()
  return runtime.resolve(workspaceId)
}

/** Refuses an oversized body from its declared length, before any of it is read. */
export function bodyTooLarge(request: Request): boolean {
  const declared = Number(request.headers.get('content-length'))
  return Number.isFinite(declared) && declared > UPLOAD_MAX_BYTES + BODY_SLACK
}

/** No declared length means no limit could apply before reading; a browser's upload always has one. */
export function lengthMissing(request: Request): boolean {
  return !request.headers.get('content-length')
}

/** A picture, a video, a sound or a document within its kind's limit; anything else in words. */
export function fileLimits(file: File): string | null {
  return uploadRefusal(file.type, file.size)
}

/**
 * The bytes as a browser should take them: media and PDFs inline, the rest as a download; never
 * sniffed, sandboxed if anything ever renders; a byte range for a player that seeks.
 */
export function fileResponse(
  request: Request,
  found: { file: { name: string; mime: string }; bytes: Uint8Array },
  caching: Record<string, string> = { 'cache-control': 'private, max-age=31536000, immutable' },
): Response {
  const length = found.bytes.byteLength
  const disposition = isInlineType(found.file.mime) ? 'inline' : 'attachment'
  const headers: Record<string, string> = {
    'content-type': found.file.mime,
    'content-disposition': `${disposition}; filename*=UTF-8''${encodeURIComponent(found.file.name)}`,
    'x-content-type-options': 'nosniff',
    'content-security-policy': 'sandbox',
    'accept-ranges': 'bytes',
    ...caching,
  }
  const range = byteRange(request.headers.get('range'), length)
  if (!range) {
    return new Response(found.bytes.slice(), {
      headers: { ...headers, 'content-length': String(length) },
    })
  }
  return new Response(found.bytes.slice(range.start, range.end + 1), {
    status: 206,
    headers: {
      ...headers,
      'content-range': `bytes ${range.start}-${range.end}/${length}`,
      'content-length': String(range.end - range.start + 1),
    },
  })
}
