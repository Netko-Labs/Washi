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

  const inputRate = cost.input ?? 0
  const cachedRate = cost.cache_read ?? inputRate
  const outputRate = cost.output ?? 0

  const total = fresh * inputRate + cached * cachedRate + (usage.outputTokens ?? 0) * outputRate
  return total / TOKENS_PER_PRICE_UNIT
}
