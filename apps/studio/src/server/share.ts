import { requestedAskSchema } from '@washi/domain'
import { historyQuerySchema, querySchema } from '@washi/ink'
import { ShareGoneError, ShareRefusedError, SuggestionRefusedError } from '@washi/service'
import { z } from 'zod'
import { washiRuntime } from '@/server/runtime'

/** What a link's page may ask the server, and nothing else (D65). */
export const shareAskSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('rows'), query: querySchema }),
  z.object({ kind: z.literal('history'), query: historyQuerySchema }),
  z.object({ kind: z.literal('table'), name: z.string().min(1).max(64) }),
  z.object({ kind: z.literal('writable'), name: z.string().min(1).max(64) }),
  z.object({ kind: z.literal('requested'), ask: requestedAskSchema }),
])

/**
 * A link names its workspace; only one the control plane knows is opened, so a stranger's URL
 * can never conjure a workspace file.
 */
export async function sharedWorkspace(workspaceId: string) {
  const { runtime } = await washiRuntime()
  const known = await runtime.control.workspaceIds()
  if (!known.includes(workspaceId)) return null
  return runtime.resolve(workspaceId)
}

/** Every refusal is a plain answer; a gone link and an unknown one read the same. */
export function shareFailure(cause: unknown): Response {
  if (cause instanceof ShareGoneError)
    return Response.json({ error: cause.message }, { status: 404 })
  if (cause instanceof ShareRefusedError) {
    return Response.json({ error: cause.message }, { status: 403 })
  }
  if (cause instanceof SuggestionRefusedError) {
    return Response.json({ error: cause.message }, { status: cause.isLimit ? 429 : 422 })
  }
  throw cause
}

/**
 * The visitor's address as the proxy saw it, hashed with the server's secret and the workspace,
 * so limits count per address and the address itself is kept nowhere (D120).
 */
export function visitorHash(request: Request, workspaceId: string): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const address = forwarded || request.headers.get('x-real-ip') || 'unknown'
  const salt = process.env.WASHI_SECRET_KEY ?? ''
  return new Bun.CryptoHasher('sha256', salt).update(`${workspaceId}\n${address}`).digest('hex')
}

export const NO_STORE = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' }
