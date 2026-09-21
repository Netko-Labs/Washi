import type { ProviderId } from './types'

/** What a workspace gets when it names a provider but no model. */
export const DEFAULT_MODELS: Record<ProviderId, string> = {
  anthropic: 'claude-opus-5',
  openrouter: 'anthropic/claude-opus-5',
}

/** The loop stops itself; the daily breaker is the outer bound. */
export const MAX_STEPS = 24
