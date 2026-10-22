import { createRequestContext, washiRuntime } from '@/server/runtime'

const MAX_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

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

/** A cover is a picture under 5 MB; anything else is refused in words. */
export function fileLimits(file: File): string | null {
  if (!IMAGE_TYPES.has(file.type)) return 'JPG, PNG or WebP only'
  if (file.size > MAX_BYTES) return 'up to 5 MB'
  return null
}
