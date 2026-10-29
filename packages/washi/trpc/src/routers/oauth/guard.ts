import { TRPCError } from '@trpc/server'
import type { OAuthContext } from '../../shared/oauth'

/** A signed-in person on a server that signs agents in; anything else is refused in words. */
export function requireOAuth(ctx: OAuthContext) {
  const { oauth } = ctx.runtime.control
  if (!oauth) {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'this server signs no agents in' })
  }
  if (!ctx.actorId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'sign in first' })
  return { oauth, actorId: ctx.actorId }
}
