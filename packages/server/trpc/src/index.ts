import { router } from './init'
import { agentsRouter } from './routers/agents'
import { capabilitiesRouter } from './routers/capabilities'
import { devRouter } from './routers/dev'
import { sheetsRouter } from './routers/sheets'
import { systemRouter } from './routers/system'
import { tablesRouter } from './routers/tables'

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
  dev: devRouter,
})

export type AppRouter = typeof appRouter

export {
  type Context,
  type ContextInput,
  createContext,
  type ResolvedWorkspace,
  type ServerMode,
  type ServerRuntime,
} from './init'
export {
  createEventBus,
  type DevCommand,
  type EventBus,
  type WashiEvents,
} from './shared/events'
