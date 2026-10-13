/** app_meta key for the embedded inference preference. */
export const INFERENCE_PREFERENCE_KEY = 'agent_inference'

/** Overrides discovery, for a `claude` installed somewhere unusual. */
export const CLAUDE_PATH_ENV = 'WASHI_CLAUDE_PATH'

/** A login can change under us; a minute is fresh enough for a settings screen. */
export const PROBE_TTL_MS = 60_000

export const PROBE_TIMEOUT_MS = 8_000

export const INFERENCE_PREFERENCES = ['auto', 'local_cli', 'api_key'] as const

/** app_meta key for which model the local CLI runs. */
export const LOCAL_MODEL_KEY = 'agent_local_model'

/** CLI aliases. `default` leaves the choice to the CLI — Opus on Max, which spends limits fastest. */
export const LOCAL_MODELS = ['default', 'opus', 'sonnet', 'haiku'] as const

/** `auth status` names a subscription login this way; anything else bills per token. */
export const PLAN_AUTH_METHOD = 'claude.ai'
