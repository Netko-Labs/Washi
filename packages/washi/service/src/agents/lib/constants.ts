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
  'db_row_activity',
  'people_list',
  // Name or move the chat: only the chat itself changes — no page or table, nothing leaves.
  'set_conversation_title',
  'chat_handover',
])

/**
 * Tools that change the workspace — pages and tables. They land without asking,
 * marked as Washi's; nothing that leaves the server (fetch, actions) is on this list.
 */
export const CHANGE_TOOLS: ReadonlySet<string> = new Set([
  'sheet_create',
  'sheet_replace',
  'sheet_delete',
  'db_define',
  'db_link_column',
  'db_mutate',
  'reminder_create',
])

/** An unanswered approval is a denial, not a hang. */
export const APPROVAL_TIMEOUT_MS = 5 * 60_000

/** How far back Today looks, and how much of it a list should hold. */
export const TODAY_WINDOW_MS = 24 * 60 * 60_000
export const TODAY_TURN_LIMIT = 20
export const PROMPT_PREVIEW_CHARS = 140

/** A routine runs unattended: its questions wait for the morning, not five minutes. */
export const ROUTINE_APPROVAL_TIMEOUT_MS = 12 * 60 * 60_000
/** The ledger's reason for a call the server's admin approved for every workspace (D118). */
export const SERVER_APPROVED = 'server'

/**
 * Whether what leaves the server waits for a person. `ask` is the law (A2);
 * `auto` is a workspace's standing yes, every call still in the ledger.
 */
export const APPROVAL_MODE_KEY = 'agent_approval_mode'
export const APPROVAL_MODES = ['ask', 'auto'] as const

/** Whether a conversation may set its own approvals — YOLO (D115). Off unless an owner says so. */
export const YOLO_ALLOWED_KEY = 'yolo_allowed'

/** Who may clear the breaker: anyone on the team (the default) or an owner. */
export const RESUME_BY_KEY = 'agent_resume_by'
export const RESUME_BY = ['anyone', 'owners'] as const

/** What a new conversation and every routine start with. The SDK's effort, in words. */
export const DEFAULT_EFFORT_KEY = 'agent_default_effort'
/** JSON `EnabledModel[]`; absent means the recommended three. */
export const ENABLED_MODELS_KEY = 'agent_enabled_models'
export const EFFORTS = ['quick', 'balanced', 'deep'] as const
export const SDK_EFFORT = { quick: 'low', balanced: 'medium', deep: 'high' } as const

/** An attached picture rides as an image block; a text file rides inline up to this size. */
export const IMAGE_TYPES: ReadonlySet<string> = new Set(['image/jpeg', 'image/png', 'image/webp'])
export const MAX_INLINE_FILE_BYTES = 200 * 1024
/** A conversation's default title: the first words of its first ask. */
export const TITLE_WORDS = 6

/** A turn whose port says nothing this long is ended (D114); a question waiting on a person pauses it. */
export const TURN_QUIET_MS = 5 * 60_000
/** After Stop or the watchdog aborts, how long a port gets to return before the turn is closed for it. */
export const TURN_GRACE_MS = 15_000
