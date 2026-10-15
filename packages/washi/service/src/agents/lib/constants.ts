/** One turn's ceiling, handed to the SDK. */
export const MAX_TURN_BUDGET_USD = 5

/** The same ceiling for a plan turn, whose cost is notional — high, but never absent. */
export const MAX_PLAN_TURN_BUDGET_USD = 25

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
  'db_history',
  'people_list',
])

/**
 * Tools that change the workspace — pages and tables. They land without asking,
 * marked as Washi's; nothing that leaves the server (fetch, actions) is on this list.
 */
export const CHANGE_TOOLS: ReadonlySet<string> = new Set([
  'sheet_create',
  'sheet_replace',
  'db_define',
  'db_mutate',
])

/** An unanswered approval is a denial, not a hang. */
export const APPROVAL_TIMEOUT_MS = 5 * 60_000

/** How far back Today looks, and how much of it a list should hold. */
export const TODAY_WINDOW_MS = 24 * 60 * 60_000
export const TODAY_TURN_LIMIT = 20
export const PROMPT_PREVIEW_CHARS = 140

/** A routine runs unattended: its questions wait for the morning, not five minutes. */
export const ROUTINE_APPROVAL_TIMEOUT_MS = 12 * 60 * 60_000
