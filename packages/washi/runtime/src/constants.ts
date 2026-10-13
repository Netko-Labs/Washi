/** Embedded has exactly one workspace; hosted falls back to it only when a request names none. */
export const DEFAULT_WORKSPACE_ID = 'default'

/** Mirrors the control plane's own floor; asserted before anything listens. */
export const MIN_SECRET_LENGTH = 32

/** Routines are scheduled to the minute; checking more often buys nothing. */
export const ROUTINE_TICK_MS = 60_000
