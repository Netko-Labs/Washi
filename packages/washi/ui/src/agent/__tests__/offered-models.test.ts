import { describe, expect, test } from 'bun:test'
import type { InferenceView } from '../lib'
import { offeredModels, RECOMMENDED_MODELS, workspaceDefaultLabel } from '../lib'

const on = (
  enabledModels: InferenceView['enabledModels'],
  provider = 'anthropic',
  defaultModel: string | null = null,
): InferenceView => ({
  active: 'api_key',
  provider,
  defaultModel,
  localModel: null,
  plan: null,
  enabledModels,
  approvalMode: 'ask',
  yoloAllowed: false,
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

describe('the workspace default, named', () => {
  test('by its label when the key names a model the chip knows', () => {
    expect(workspaceDefaultLabel(on(null, 'anthropic', 'claude-sonnet-5-5'))).toBe(
      'Workspace default (Sonnet 5.5)',
    )
    const picks = [{ provider: 'anthropic', id: 'claude-fable-5-1', name: 'Claude Fable 5.1' }]
    expect(workspaceDefaultLabel(on(picks, 'anthropic', 'claude-opus-5-5'))).toBe(
      'Workspace default (Opus 5.5)',
    )
  })

  test('by its id when the chip has no name for it, and plainly when the key names none', () => {
    expect(workspaceDefaultLabel(on(null, 'openrouter', 'x/y'))).toBe('Workspace default (x/y)')
    expect(workspaceDefaultLabel(on(null))).toBe('Workspace default')
    expect(workspaceDefaultLabel(null)).toBe('Workspace default')
  })
})
