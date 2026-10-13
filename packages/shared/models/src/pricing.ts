import { TOKENS_PER_PRICE_UNIT } from './constants'
import type { ModelEntry, TokenUsage } from './types'

/**
 * What a turn cost, from the token counts a provider reports and the per-MTok
 * prices models.dev publishes. This is what lets the daily breaker mean
 * something on a provider that bills in tokens rather than dollars.
 *
 * Null when the model has no published price — the caller must not treat an
 * unpriced turn as a free one.
 */
export function priceTurn(model: ModelEntry | null, usage: TokenUsage): number | null {
  const cost = model?.cost
  if (!cost || (cost.input == null && cost.output == null)) return null

  const cached = usage.cachedInputTokens ?? 0
  const fresh = Math.max(0, (usage.inputTokens ?? 0) - cached)
  const output = usage.outputTokens ?? 0

  const inputRate = cost.input
  const cachedRate = cost.cache_read ?? inputRate
  const outputRate = cost.output
  // A missing rate is unknown, not free: only absent usage may skip it.
  if ((fresh && inputRate == null) || (cached && cachedRate == null)) return null
  if (output && outputRate == null) return null

  const total = fresh * (inputRate ?? 0) + cached * (cachedRate ?? 0) + output * (outputRate ?? 0)
  return total / TOKENS_PER_PRICE_UNIT
}
