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

/** A human. Embedded mode has none — there is only ever one person at the machine. */
export interface Actor {
  id: string
  email: string
  name: string
}

export interface WorkspaceRef {
  id: string
  name: string
  role: string
}

/**
 * Identity and membership. The hosted implementation is Postgres + Better Auth;
 * the embedded one is a stub with one workspace and nobody to authenticate.
 * Having both behind this interface is what makes phase 7 a redeployment
 * rather than a rewrite (C2).
 */
export interface SecretStore {
  info(workspaceId: string): Promise<{ last4: string; updatedAt: Date } | null>
  set(workspaceId: string, actorId: string, key: string): Promise<{ last4: string }>
}

export interface ControlPlane {
  /** Null when the request carries no valid session. */
  authenticate(request: Request): Promise<Actor | null>
  /** Embedded always says yes; hosted checks organization membership. */
  authorize(actorId: string | null, workspaceId: string): Promise<boolean>
  listWorkspaces(actorId: string | null): Promise<WorkspaceRef[]>
  /** Auth and organization routes, or null when this request is not one. */
  handle(request: Request): Promise<Response | null>
  /** Absent in embedded mode: there is no BYOK, the machine's own env supplies the key. */
  secrets?: SecretStore
  close(): Promise<void>
}

export interface ServerRuntime {
  mode: ServerMode
  events: EventBus
  /** Embedded points every id at one local file; hosted asks the control plane. */
  resolve(workspaceId: string): ResolvedWorkspace
  control: ControlPlane
  defaultWorkspaceId: string
}

export interface Context {
  mode: ServerMode
  /** Which human. Null in embedded mode — there is only ever one. */
  actor: Actor | null
  actorId: string | null
  workspaceId: string
  runtime: ServerRuntime
  events: EventBus
}

export interface ContextInput {
  workspaceId?: string | null
  actor?: Actor | null
}

export function createContext(runtime: ServerRuntime, input: ContextInput = {}): Context {
  const actor = runtime.mode === 'embedded' ? null : (input.actor ?? null)
  return {
    mode: runtime.mode,
    actor,
    actorId: actor?.id ?? null,
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
export const workspaceProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (ctx.mode === 'hosted' && !ctx.actorId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'sign in to open a workspace' })
  }

  // NOT_FOUND rather than FORBIDDEN on purpose: a non-member learns nothing
  // about whether a workspace exists.
  const allowed = await ctx.runtime.control.authorize(ctx.actorId, ctx.workspaceId)
  if (!allowed) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `unknown workspace "${ctx.workspaceId}"` })
  }

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
