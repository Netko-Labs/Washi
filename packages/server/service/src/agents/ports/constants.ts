/** The loop stops itself; the daily breaker is the outer bound. */
export const MAX_STEPS = 24

/**
 * Preference, in order, for a workspace that named a provider but no model.
 *
 * This list is opinionated on purpose. Picking the cheapest tool-capable model
 * from the catalogue sounds data-driven and is wrong: on OpenRouter the
 * cheapest is a $0 preview, and Washi's whole product is that the agent designs
 * the page. The catalogue decides what *exists* and what it *costs*; this
 * decides what is good enough to hand someone who did not choose.
 */
export const PREFERRED_MODELS: Record<string, readonly string[]> = {
  anthropic: ['claude-sonnet-5', 'claude-opus-5', 'claude-sonnet-4-6', 'claude-haiku-4-5'],
  openrouter: [
    'anthropic/claude-sonnet-5',
    'anthropic/claude-opus-5',
    'openai/gpt-5.4',
    'google/gemini-3-pro',
  ],
}

/** Only when the catalogue is unreachable and no preference matched. */
export const LAST_RESORT_MODELS: Record<string, string> = {
  anthropic: 'claude-sonnet-5',
  openrouter: 'anthropic/claude-sonnet-5',
}

/** A $0 model is a rate-limited preview, never a sane default for a workspace. */
export const MIN_SERIOUS_PRICE = 0
