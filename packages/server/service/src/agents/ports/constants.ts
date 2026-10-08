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

/**
 * `tools: []` already removes every built-in; this list is the belt to that
 * pair of braces, for a newer CLI that might treat an empty list differently.
 */
export const DISALLOWED_BUILTINS = [
  'Agent',
  'Bash',
  'BashOutput',
  'Edit',
  'Glob',
  'Grep',
  'KillShell',
  'NotebookEdit',
  'Read',
  'Skill',
  'Task',
  'WebFetch',
  'WebSearch',
  'Write',
]

/** What a rejected credential sounds like, from either a signed-out CLI or a bad key. */
export const REJECTED_PATTERN =
  /invalid api key|api key is invalid|please run \/login|not logged in|oauth token|failed to authenticate|\b401\b/i

/** `apiKeySource` values that mean a key, not a plan, is paying for the turn. */
export const KEYED_SOURCES: ReadonlySet<string> = new Set(['user', 'project', 'org', 'temporary'])
