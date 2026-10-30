import {
  byteRange,
  contentDisposition,
  isInlineType,
  largestUpload,
  type UploadCaps,
  uploadCaps,
  uploadKindOf,
  uploadRefusal,
} from '@washi/domain'
import { codeLimits } from '@washi/service'
import type { ResolvedWorkspace } from '@washi/trpc'
import { FILE_CSP } from '@/server/constants'
import { createRequestContext, washiRuntime } from '@/server/runtime'
import type { FileRefusal } from '@/server/types'

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

/** What this workspace's uploads may weigh: the server's caps (D118). */
export const capsOf = (resolved: ResolvedWorkspace): UploadCaps =>
  uploadCaps(codeLimits(resolved.workspace))

/** Refuses an oversized body from its declared length, before any of it is read. */
export function bodyTooLarge(request: Request, caps: UploadCaps): boolean {
  const declared = Number(request.headers.get('content-length'))
  return Number.isFinite(declared) && declared > largestUpload(caps) + BODY_SLACK
}

/** No declared length means no limit could apply before reading; a browser's upload always has one. */
export function lengthMissing(request: Request): boolean {
  return !request.headers.get('content-length')
}

/** A picture, a video, a sound or a document within its kind's limit; anything else in words. */
export function fileLimits(file: File, caps: UploadCaps): FileRefusal | null {
  const error = uploadRefusal(file.type, file.size, undefined, caps)
  if (!error) return null
  const status = !uploadKindOf(file.type) ? 415 : file.size === 0 ? 400 : 413
  return { error, status }
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
  const headers: Record<string, string> = {
    'content-type': found.file.mime,
    'content-disposition': contentDisposition(found.file.name, isInlineType(found.file.mime)),
    'x-content-type-options': 'nosniff',
    'content-security-policy': FILE_CSP,
    'accept-ranges': 'bytes',
    ...caching,
  }
  const range = byteRange(request.headers.get('range'), length)
  if (range === 'unsatisfiable') {
    return new Response(null, {
      status: 416,
      headers: { ...headers, 'content-range': `bytes */${length}` },
    })
  }
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
