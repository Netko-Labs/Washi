import { router } from './init'
import { agentsRouter } from './routers/agents'
import { capabilitiesRouter } from './routers/capabilities'
import { commentsRouter } from './routers/comments'
import { devRouter } from './routers/dev'
import { embedsRouter } from './routers/embeds'
import { emojisRouter } from './routers/emojis'
import { filesRouter } from './routers/files'
import { instanceRouter } from './routers/instance'
import { linksRouter } from './routers/links'
import { liveRouter } from './routers/live'
import { modelsRouter } from './routers/models'
import { remindersRouter } from './routers/reminders'
import { routinesRouter } from './routers/routines'
import { scriptsRouter } from './routers/scripts'
import { sheetsRouter } from './routers/sheets'
import { storageRouter } from './routers/storage'
import { systemRouter } from './routers/system'
import { tablesRouter } from './routers/tables'
import { themesRouter } from './routers/themes'
import { tokensRouter } from './routers/tokens'
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
  storage: storageRouter,
  tokens: tokensRouter,
  embeds: embedsRouter,
  emojis: emojisRouter,
  links: linksRouter,
  scripts: scriptsRouter,
  themes: themesRouter,
  tables: tablesRouter,
  agents: agentsRouter,
  capabilities: capabilitiesRouter,
  workspaces: workspacesRouter,
  instance: instanceRouter,
  models: modelsRouter,
  routines: routinesRouter,
  reminders: remindersRouter,
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
  type Integration,
  type ResolvedWorkspace,
  type SecretStore,
  type ServerMode,
  type ServerRuntime,
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
export { type InstanceStore, SIGNUP_MODES, type SignupMode } from './shared/instance'
export { isTrustedOrigin } from './shared/origin'
export {
  AGENT_PRESENCE_TTL_MS,
  createPresenceBoard,
  type PagePresence,
  type PresenceBoard,
} from './shared/presence'
export type { StorageConfig, StorageInfo, StorageStore } from './shared/storage'
export type {
  AccessTokenInfo,
  IssuedAccessToken,
  TokenOwner,
  TokenStore,
} from './shared/tokens'
export { closeAllPeers, createTRPCWebSocketHooks, type PeerLike } from './ws'
