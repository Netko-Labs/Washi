/** One turn's ceiling, handed to the SDK. */
export const MAX_TURN_BUDGET_USD = 5

/**
 * A day's ceiling for the whole workspace — a safety stop, not a quota. This is
 * OSS with no pricing; the cap exists so an agent loop on someone else's key
 * cannot run all night.
 */
export const DAILY_CAP_USD_KEY = 'agent_daily_cap_usd'
export const DEFAULT_DAILY_CAP_USD = 25
