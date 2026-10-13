import { describe, expect, test } from 'bun:test'
import { createUsageTally } from '../agents/ports/usage'

describe('a turn is charged from the first byte of each response', () => {
  test('a response that never completed still counts its prompt and what it wrote', () => {
    const usage = createUsageTally()
    usage.started('msg_1', { input_tokens: 1200, cache_read_input_tokens: 800, output_tokens: 1 })
    usage.delta({ output_tokens: 340 })
    expect(usage.total()).toEqual({ inputTokens: 2000, outputTokens: 340, cachedInputTokens: 800 })
  })

  test('the same response reported again is counted once, at its largest', () => {
    const usage = createUsageTally()
    usage.started('msg_1', { input_tokens: 100, output_tokens: 1 })
    usage.completed('msg_1', { input_tokens: 100, output_tokens: 50 })
    usage.completed('msg_1', { input_tokens: 100, output_tokens: 50 })
    usage.started('msg_2', { input_tokens: 300, output_tokens: 1 })
    usage.delta({ output_tokens: 20 })
    expect(usage.total()).toEqual({ inputTokens: 400, outputTokens: 70, cachedInputTokens: 0 })
  })
})
