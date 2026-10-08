/** app_meta key for the embedded inference preference. */
export const INFERENCE_PREFERENCE_KEY = 'agent_inference'

/** Overrides discovery, for a `claude` installed somewhere unusual. */
export const CLAUDE_PATH_ENV = 'WASHI_CLAUDE_PATH'

/** A login can change under us; a minute is fresh enough for a settings screen. */
export const PROBE_TTL_MS = 60_000

export const PROBE_TIMEOUT_MS = 8_000

export const INFERENCE_PREFERENCES = ['auto', 'local_cli', 'api_key'] as const
