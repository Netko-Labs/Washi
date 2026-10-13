import { router } from './init'
import { agentsRouter } from './routers/agents'
import { capabilitiesRouter } from './routers/capabilities'
import { devRouter } from './routers/dev'
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
  tables: tablesRouter,
  agents: agentsRouter,
  capabilities: capabilitiesRouter,
  workspaces: workspacesRouter,
  models: modelsRouter,
  routines: routinesRouter,
  dev: devRouter,
})

export type AppRouter = typeof appRouter

export {
  type Actor,
  type AgentCredentialInput,
  type Context,
  type ContextInput,
  type ControlPlane,
  createContext,
  type ResolvedWorkspace,
  type SecretStore,
  type ServerMode,
  type ServerRuntime,
  type WorkspaceRef,
} from './init'
export {
  createEventBus,
  type DevCommand,
  type EventBus,
  type WashiEvents,
} from './shared/events'
