import { describe, expect, test } from 'bun:test'
import type { TranscriptEntry } from '@washi/domain'
import { mergeMessageChunks } from '../lib'

const chunk = (id: string, text: string) =>
  ({ id, update: { kind: 'message_chunk', text } }) as unknown as TranscriptEntry

describe('streamed fragments are one message', () => {
  test('adjacent chunks merge; a tool call splits them', () => {
    const tool = { id: 't', update: { kind: 'tool_call' } } as unknown as TranscriptEntry
    const merged = mergeMessageChunks([
      chunk('a', '**Read'),
      chunk('b', 'ing**'),
      tool,
      chunk('c', 'done'),
    ])
    expect(merged.map((entry) => entry.id)).toEqual(['a', 't', 'c'])
    const first = merged[0]?.update
    expect(first?.kind === 'message_chunk' && first.text).toBe('**Reading**')
  })
})
