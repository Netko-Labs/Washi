import { initTRPC, TRPCError } from '@trpc/server'
import type { Workspace } from '@washi/repository'
import type { AgentHost } from '@washi/service'
import type { EventBus } from './shared/events'

/**
 * Deployment mode. Asserted once at boot, never per request (C2) — two auth
 * paths decided per-call is where auth bypasses get shipped.
 */
export type ServerMode = 'hosted' | 'embedded'

export interface ResolvedWorkspace {
  workspace: Workspace
  host: AgentHost
}

export interface ServerRuntime {
  mode: ServerMode
  events: EventBus
  /** Embedded points every id at one local file; hosted asks the control plane. */
  resolve(workspaceId: string): ResolvedWorkspace
  defaultWorkspaceId: string
}

export interface Context {
  mode: ServerMode
  /** Which human. Null in embedded mode — there is only ever one. */
  actorId: string | null
  workspaceId: string
  runtime: ServerRuntime
  events: EventBus
}

export interface ContextInput {
  workspaceId?: string | null
  actorId?: string | null
}

export function createContext(runtime: ServerRuntime, input: ContextInput = {}): Context {
  return {
    mode: runtime.mode,
    actorId: runtime.mode === 'embedded' ? null : (input.actorId ?? null),
    workspaceId: input.workspaceId || runtime.defaultWorkspaceId,
    runtime,
    events: runtime.events,
  }
}

const t = initTRPC.context<Context>().create()

export const router = t.router
export const mergeRouters = t.mergeRouters
export const publicProcedure = t.procedure

/**
 * Every procedure that touches content. Resolving here is what keeps
 * `repository` and `service` free of requests, users and networks (C3).
 */
export const workspaceProcedure = t.procedure.use(({ ctx, next }) => {
  let resolved: ResolvedWorkspace
  try {
    resolved = ctx.runtime.resolve(ctx.workspaceId)
  } catch (cause) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `unknown workspace "${ctx.workspaceId}"`,
      cause,
    })
  }
  return next({
    ctx: { ...ctx, ws: resolved.workspace, host: resolved.host },
  })
})
