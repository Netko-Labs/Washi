import { initTRPC, TRPCError } from '@trpc/server'
import type { Viewer } from '@washi/domain'
import type { FileStore, Workspace } from '@washi/repository'
import {
  type AgentHost,
  CommentError,
  CustomEmojiError,
  InkError,
  requireReadable,
  SheetAccessError,
  SheetConflictError,
  SheetMoveError,
  SheetNotFoundError,
  SheetUndoError,
  SheetValidationError,
} from '@washi/service'
import type { EventBus } from './shared/events'
import type { PresenceBoard } from './shared/presence'
import type { StorageStore } from './shared/storage'

/**
 * Deployment mode. Asserted once at boot, never per request (C2) — two auth
 * paths decided per-call is where auth bypasses get shipped.
 */
export type ServerMode = 'hosted' | 'embedded'

export interface ResolvedWorkspace {
  workspace: Workspace
  host: AgentHost
  files: FileStore
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
export interface AgentCredentialInput {
  key: string
  provider: string
  model?: string | null
}

/** Services Washi reaches out to with a key of its own. Exa searches the web. */
export const INTEGRATIONS = ['exa'] as const
export type Integration = (typeof INTEGRATIONS)[number]

export interface SecretStore {
  info(workspaceId: string): Promise<{
    last4: string
    provider: string
    model: string | null
    updatedAt: Date
    updatedBy: string | null
  } | null>
  set(
    workspaceId: string,
    actorId: string,
    credential: AgentCredentialInput,
  ): Promise<{ last4: string }>
  /** The default model rides with the key; this changes it without a new secret. */
  setModel(workspaceId: string, actorId: string, model: string | null): Promise<void>
  /** Washi falls asleep until another key is set. */
  remove(workspaceId: string): Promise<void>
  integrationInfo(
    workspaceId: string,
    integration: Integration,
  ): Promise<{ last4: string; updatedAt: Date } | null>
  setIntegration(
    workspaceId: string,
    actorId: string,
    integration: Integration,
    key: string,
  ): Promise<{ last4: string }>
  removeIntegration(workspaceId: string, integration: Integration): Promise<void>
}

export const SIGNUP_MODES = ['invite', 'open'] as const
export type SignupMode = (typeof SIGNUP_MODES)[number]

/** The server's own settings, held by its app admins (its first account). Absent in embedded mode. */
export interface InstanceStore {
  isAdmin(actorId: string): Promise<boolean>
  signup(): Promise<SignupMode>
  setSignup(mode: SignupMode): Promise<void>
}

export interface ControlPlane {
  /** Null when the request carries no valid session. */
  authenticate(request: Request): Promise<Actor | null>
  /** Embedded always says yes; hosted checks organization membership. */
  authorize(actorId: string | null, workspaceId: string): Promise<boolean>
  listWorkspaces(actorId: string | null): Promise<WorkspaceRef[]>
  /** Who a person cell or a mention can name. Embedded has one: the person at the machine. */
  listMembers(workspaceId: string): Promise<{ id: string; name: string }[]>
  /** Every workspace that exists, for the server's own clock — never for a request. */
  workspaceIds(): Promise<string[]>
  /** Auth and organization routes, or null when this request is not one. */
  handle(request: Request): Promise<Response | null>
  /** Absent in embedded mode: there is no BYOK, the machine's own env supplies the key. */
  secrets?: SecretStore
  instance?: InstanceStore
  storage?: StorageStore
  close(): Promise<void>
}

export interface ServerRuntime {
  mode: ServerMode
  events: EventBus
  /** Embedded points every id at one local file; hosted asks the control plane. */
  resolve(workspaceId: string): ResolvedWorkspace
  control: ControlPlane
  defaultWorkspaceId: string
  presence: PresenceBoard
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

/** Which routers' writes move pages, and which move table data. */
const CHANGES: Record<string, ('page' | 'data')[]> = {
  sheets: ['page'],
  tables: ['data', 'page'],
  capabilities: ['data', 'page'],
}

/**
 * Every procedure that touches content. Resolving here is what keeps
 * `repository` and `service` free of requests, users and networks (C3).
 */
export const workspaceProcedure = t.procedure
  .use(async ({ next }) => {
    // A page the validator refused, a move into itself, a reply to another page's thread: the
    // caller's mistake, so 400, not 500.
    const result = await next()
    if (
      !result.ok &&
      (result.error.cause instanceof SheetValidationError ||
        result.error.cause instanceof SheetMoveError ||
        result.error.cause instanceof SheetUndoError ||
        result.error.cause instanceof SheetConflictError ||
        result.error.cause instanceof InkError ||
        result.error.cause instanceof SheetAccessError ||
        result.error.cause instanceof CommentError ||
        result.error.cause instanceof CustomEmojiError)
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: result.error.cause.message,
        cause: result.error.cause,
      })
    }
    if (!result.ok && result.error.cause instanceof SheetNotFoundError) {
      throw new TRPCError({ code: 'NOT_FOUND', message: result.error.cause.message })
    }
    return result
  })
  .use(async ({ ctx, next }) => {
    if (ctx.mode === 'hosted' && !ctx.actorId) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'sign in to open a workspace' })
    }

    // NOT_FOUND rather than FORBIDDEN on purpose: a non-member learns nothing
    // about whether a workspace exists.
    const allowed = await ctx.runtime.control.authorize(ctx.actorId, ctx.workspaceId)
    if (!allowed) {
      throw new TRPCError({ code: 'NOT_FOUND', message: `unknown workspace "${ctx.workspaceId}"` })
    }

    // Membership above is the only unknown-workspace answer; a throw here is a
    // failed open (disk, sqlite) and surfaces as INTERNAL_SERVER_ERROR.
    const resolved = ctx.runtime.resolve(ctx.workspaceId)
    // Embedded's one person owns everything; hosted owners read every page, private or not.
    const viewer: Viewer =
      ctx.mode === 'embedded'
        ? { id: ctx.actorId ?? 'local', isOwner: true }
        : { id: ctx.actorId, isOwner: (await roleOf(ctx)) === 'owner' }
    return next({
      ctx: { ...ctx, ws: resolved.workspace, host: resolved.host, files: resolved.files, viewer },
    })
  })
  .use(async ({ ctx, path, type, getRawInput, next }) => {
    const result = await next()
    // Every write tells the workspace's other viewers; pages and data refetch on their own.
    if (result.ok && type === 'mutation') {
      const input = (await getRawInput().catch(() => null)) as { id?: unknown } | null
      const id = typeof input?.id === 'string' ? input.id : null
      for (const kind of CHANGES[path.split('.')[0] ?? ''] ?? []) {
        ctx.events.emit('workspaceChanged', { workspaceId: ctx.workspaceId, kind, id })
      }
    }
    return result
  })

const PAGE_KEYS = ['id', 'sheetId', 'parentId'] as const

/**
 * A procedure about one page: whatever page ids its input names must be readable by the asker
 * (D65), or it answers NOT_FOUND before the handler runs.
 */
export const pageProcedure = workspaceProcedure.use(async ({ ctx, getRawInput, next }) => {
  const input = (await getRawInput().catch(() => null)) as Record<string, unknown> | null
  for (const key of PAGE_KEYS) {
    const id = input?.[key]
    if (typeof id === 'string') requireReadable(ctx.ws, id, ctx.viewer)
  }
  return next()
})

async function roleOf(ctx: {
  runtime: { control: ControlPlane }
  actorId: string | null
  workspaceId: string
}): Promise<string | undefined> {
  const workspaces = await ctx.runtime.control.listWorkspaces(ctx.actorId)
  return workspaces.find((entry) => entry.id === ctx.workspaceId)?.role
}

/** Roles that may change what the workspace lets its agent do. Embedded's one person is the owner. */
const STEWARD_ROLES: ReadonlySet<string> = new Set(['owner', 'admin'])

/**
 * A member runs the workspace; an owner or admin shapes it. Settings that
 * widen what Washi may do unasked — the approval mode, the keys it reaches
 * out with — are theirs alone, so one member cannot lower the whole team's guard.
 */
export async function isSteward(ctx: {
  runtime: { control: ControlPlane }
  actorId: string | null
  workspaceId: string
}): Promise<boolean> {
  const role = await roleOf(ctx)
  return Boolean(role && STEWARD_ROLES.has(role))
}

export const ownerProcedure = workspaceProcedure.use(async ({ ctx, next }) => {
  if (!(await isSteward(ctx))) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'only a workspace owner can change this' })
  }
  return next()
})

/** The server's own settings: its app admins only, whatever workspace the request names. */
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  const store = ctx.runtime.control.instance
  if (!store || !ctx.actorId || !(await store.isAdmin(ctx.actorId))) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'only an app admin can change this' })
  }
  return next({ ctx: { ...ctx, instance: store } })
})
