/** One turn's ceiling, handed to the SDK. */
export const MAX_TURN_BUDGET_USD = 5

/**
 * A day's ceiling for the whole workspace — a safety stop, not a quota. This is
 * OSS with no pricing; the cap exists so an agent loop on someone else's key
 * cannot run all night.
 */
export const DAILY_CAP_USD_KEY = 'agent_daily_cap_usd'
export const DEFAULT_DAILY_CAP_USD = 25

/**
 * A backstop for models with no published price — `openrouter/auto` routes to
 * anything and publishes nothing, so a dollar cap cannot see it. Turns can.
 */
export const DAILY_TURN_CAP_KEY = 'agent_daily_turn_cap'
export const DEFAULT_DAILY_TURN_CAP = 200

/** Tools that never stop at the desk. Everything else asks a person first. */
export const READ_TOOLS: ReadonlySet<string> = new Set([
  'sheet_list',
  'sheet_get',
  'sheet_check',
  'sheet_backlinks',
  'search',
  'db_list_tables',
  'db_query',
])

/** An unanswered approval is a denial, not a hang. */
export const APPROVAL_TIMEOUT_MS = 5 * 60_000
