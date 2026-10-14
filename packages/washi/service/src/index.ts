export { AgentHost } from './agents/host'
export {
  CLAUDE_PATH_ENV,
  createEmbeddedKeySource,
  createStoredKeySource,
  INFERENCE_PREFERENCES,
  LOCAL_MODELS,
  type StoredKey,
  type StoredKeyLookup,
} from './agents/inference'
export {
  type AgentActivity,
  type AgentCredential,
  type AgentHostEvents,
  type AgentKeySource,
  type AgentSpendReport,
  agentEnv,
  type BreakerState,
  type Caller,
  DAILY_CAP_USD_KEY,
  DEFAULT_DAILY_CAP_USD,
  type InferencePreference,
  type InferenceStatus,
  type LocalCliStatus,
  type LocalModel,
} from './agents/lib'
export type { AgentPort, ModelChoice, ProviderId, ToolGate } from './agents/ports'
export { defaultModelFor, LAST_RESORT_MODELS, PREFERRED_MODELS } from './agents/ports'
export {
  checkSource,
  createSheetFromSource,
  removeSheet,
  requireSheet,
  SheetValidationError,
  updateSheetFromSource,
  type WsxCheck,
} from './sheets/service'
export { moveSheetTo, restoreSheetTree, SheetMoveError } from './sheets/tree'
export {
  defineUserTable,
  deleteRecord,
  InkError,
  runMutation,
  runQuery,
  toggleTaskRecord,
  updateRecord,
} from './tables/service'
