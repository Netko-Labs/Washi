import { router } from './init'
import { agentsRouter } from './routers/agents'
import { capabilitiesRouter } from './routers/capabilities'
import { commentsRouter } from './routers/comments'
import { devRouter } from './routers/dev'
import { filesRouter } from './routers/files'
import { instanceRouter } from './routers/instance'
import { liveRouter } from './routers/live'
import { modelsRouter } from './routers/models'
import { routinesRouter } from './routers/routines'
import { sheetsRouter } from './routers/sheets'
import { systemRouter } from './routers/system'
import { tablesRouter } from './routers/tables'
import { workspacesRouter } from './routers/workspaces'

/**
 * Washi's whole API surface. Composition only — every handler lives in its
 * router folder, and nothing here reaches past the service layer.
 */
export const appRouter = router({
  system: systemRouter,
  sheets: sheetsRouter,
  comments: commentsRouter,
  files: filesRouter,
  tables: tablesRouter,
  agents: agentsRouter,
  capabilities: capabilitiesRouter,
  workspaces: workspacesRouter,
  instance: instanceRouter,
  models: modelsRouter,
  routines: routinesRouter,
  dev: devRouter,
  live: liveRouter,
})

export type AppRouter = typeof appRouter

export { createTRPCHttpHandler, MAX_TRPC_BATCH_SIZE } from './http'
export {
  type Actor,
  type AgentCredentialInput,
  type Context,
  type ContextInput,
  type ControlPlane,
  createContext,
  INTEGRATIONS,
  type InstanceStore,
  type Integration,
  type ResolvedWorkspace,
  type SecretStore,
  type ServerMode,
  type ServerRuntime,
  SIGNUP_MODES,
  type SignupMode,
  type WorkspaceRef,
} from './init'
export { createMirinBridge, type MirinFrame } from './mirin'
export {
  type CreateContextOptions,
  contextFromRequest,
  type EdgeLogger,
  WORKSPACE_HEADER,
} from './shared/edge'
export {
  createEventBus,
  type DevCommand,
  type EventBus,
  type WashiEvents,
} from './shared/events'
export { isTrustedOrigin } from './shared/origin'
export {
  AGENT_PRESENCE_TTL_MS,
  createPresenceBoard,
  type PagePresence,
  type PresenceBoard,
} from './shared/presence'
export { closeAllPeers, createTRPCWebSocketHooks, type PeerLike } from './ws'
