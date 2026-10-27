import { describe, expect, test } from 'bun:test'
import type { InferenceView } from '../lib'
import { offeredModels, RECOMMENDED_MODELS } from '../lib'

const on = (
  enabledModels: InferenceView['enabledModels'],
  provider = 'anthropic',
): InferenceView => ({
  active: 'api_key',
  provider,
  localModel: null,
  plan: null,
  enabledModels,
})

describe('the composer’s model chip', () => {
  test('offers the team’s picks for the key’s provider, described when recommended', () => {
    const offered = offeredModels(
      on([
        { provider: 'anthropic', id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5' },
        { provider: 'anthropic', id: 'claude-fable-5-1', name: 'Claude Fable 5.1' },
      ]),
    )
    expect(offered).toEqual([
      { id: 'claude-sonnet-5-5', label: 'Sonnet 5.5', desc: 'Balanced' },
      { id: 'claude-fable-5-1', label: 'Fable 5.1', desc: '' },
    ])
  })

  test('is never empty: nothing chosen, all switched off, or chosen under another key', () => {
    expect(offeredModels(on(null))).toEqual(RECOMMENDED_MODELS.anthropic ?? [])
    expect(offeredModels(on([]))).toEqual(RECOMMENDED_MODELS.anthropic ?? [])
    const picks = [{ provider: 'anthropic', id: 'claude-fable-5-1', name: 'Claude Fable 5.1' }]
    expect(offeredModels(on(picks, 'openrouter'))).toEqual(RECOMMENDED_MODELS.openrouter ?? [])
  })
})
