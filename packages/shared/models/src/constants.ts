export const MODELS_DEV_URL = 'https://models.dev/api.json'

/** The payload is ~4.7MB. It is fetched once a day, never per turn. */
export const CATALOGUE_TTL_MS = 24 * 60 * 60 * 1000
export const FETCH_TIMEOUT_MS = 15_000
/** After a failed refresh, the stale copy is served without refetching for this long. */
export const CATALOGUE_RETRY_MS = 5 * 60 * 1000

/** models.dev prices per million tokens. */
export const TOKENS_PER_PRICE_UNIT = 1_000_000

/** Providers Washi can actually reach — an installed AI SDK package each. */
export const SUPPORTED_PROVIDERS = ['anthropic', 'openrouter'] as const
