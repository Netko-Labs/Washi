import { describe, expect, test } from 'bun:test'
import { sentToModel } from '../utils'

describe('what every turn sends, in words', () => {
  test('names the provider of the key Washi runs on', () => {
    expect(sentToModel('anthropic')).toContain('sent to Anthropic')
    expect(sentToModel('openrouter')).toContain('sent to OpenRouter')
  })

  test('still says it with no key yet', () => {
    expect(sentToModel(null)).toBe(
      'On every turn, what you ask and the pages Washi reads are sent to the model provider of the key Washi runs on.',
    )
  })
})
