import { describe, expect, test } from 'bun:test'
import { createModelCatalogue } from '../catalogue'
import { priceTurn } from '../pricing'

const LIVE_SHAPE = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    models: {
      'claude-opus-5': { id: 'claude-opus-5', tool_call: true, cost: { input: 5, output: 25 } },
      'ancient-completion': { id: 'ancient-completion', tool_call: false },
    },
  },
  someone_else: { id: 'someone_else', models: {} },
}

const ok = (body: unknown) =>
  (async () => new Response(JSON.stringify(body), { status: 200 })) as unknown as typeof fetch

describe('the catalogue is a convenience, never a dependency', () => {
  test('a reachable models.dev is used', async () => {
    const catalogue = createModelCatalogue({ fetchImpl: ok(LIVE_SHAPE) })
    expect((await catalogue.list('anthropic')).map((m) => m.id)).toContain('claude-opus-5')
    expect(catalogue.source()).toBe('network')
  })

  test('an unreachable one falls back instead of failing', async () => {
    const catalogue = createModelCatalogue({
      fetchImpl: (async () => {
        throw new Error('offline')
      }) as unknown as typeof fetch,
    })
    expect((await catalogue.list()).length).toBeGreaterThan(0)
    expect(catalogue.source()).toBe('fallback')
  })

  test('a non-200 falls back too', async () => {
    const catalogue = createModelCatalogue({
      fetchImpl: (async () => new Response('nope', { status: 503 })) as unknown as typeof fetch,
    })
    expect((await catalogue.list()).length).toBeGreaterThan(0)
    expect(catalogue.source()).toBe('fallback')
  })

  test('models that cannot call a tool are dropped — they cannot write a sheet', async () => {
    const catalogue = createModelCatalogue({ fetchImpl: ok(LIVE_SHAPE) })
    expect((await catalogue.list('anthropic')).map((m) => m.id)).not.toContain('ancient-completion')
  })

  test('providers Washi cannot reach are pruned — 222 is not a picker', async () => {
    const catalogue = createModelCatalogue({ fetchImpl: ok(LIVE_SHAPE) })
    expect((await catalogue.list()).map((m) => m.provider)).not.toContain('someone_else')
  })

  test('it fetches once, not per lookup — the payload is ~4.7MB', async () => {
    let calls = 0
    const catalogue = createModelCatalogue({
      fetchImpl: (async () => {
        calls += 1
        return new Response(JSON.stringify(LIVE_SHAPE), { status: 200 })
      }) as unknown as typeof fetch,
    })
    await Promise.all([catalogue.load(), catalogue.load(), catalogue.list()])
    await catalogue.model('anthropic', 'claude-opus-5')
    expect(calls).toBe(1)
  })
})

describe('pricing a turn', () => {
  const model = { id: 'x', cost: { input: 5, output: 25, cache_read: 0.5 } }

  test('input and output are billed at their own rates', () => {
    expect(priceTurn(model, { inputTokens: 1_000_000, outputTokens: 0 })).toBeCloseTo(5)
    expect(priceTurn(model, { inputTokens: 0, outputTokens: 1_000_000 })).toBeCloseTo(25)
  })

  test('cached input is billed at the cache rate, not the fresh one', () => {
    expect(priceTurn(model, { inputTokens: 1_000_000, cachedInputTokens: 1_000_000 })).toBeCloseTo(
      0.5,
    )
  })

  test('an unpriced model returns null, never zero', () => {
    // A free-looking turn would let the breaker wave through an unknown model.
    expect(priceTurn({ id: 'y' }, { inputTokens: 999_999 })).toBeNull()
    expect(priceTurn(null, { inputTokens: 999_999 })).toBeNull()
  })
})
