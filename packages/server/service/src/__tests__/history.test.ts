import { describe, expect, test } from 'bun:test'
import type { AgentUpdate, TranscriptEntry } from '@washi/domain'
import { conversationHistory } from '../agents/history'

const transcript = (updates: AgentUpdate[]): TranscriptEntry[] =>
  updates.map((update, seq) => ({ id: String(seq), seq, update, createdAt: '' }))

describe('the AI SDK port is handed both sides of the conversation', () => {
  test('assistant replies sit between the user messages they answered', () => {
    const history = conversationHistory(
      transcript([
        { kind: 'user_message', text: 'hi' },
        { kind: 'message_chunk', text: 'Hel' },
        { kind: 'tool_call', toolCallId: 't', title: 'x', toolKind: 'read', status: 'completed' },
        { kind: 'message_chunk', text: 'lo' },
        { kind: 'turn_done', stopReason: 'end_turn' },
        { kind: 'user_message', text: 'again' },
      ]),
    )
    expect(history).toEqual([
      { role: 'user', text: 'hi' },
      { role: 'assistant', text: 'Hello' },
    ])
  })

  test('a turn that never answered still keeps its question', () => {
    const history = conversationHistory(
      transcript([
        { kind: 'user_message', text: 'one' },
        { kind: 'turn_done', stopReason: 'error', error: 'no key' },
        { kind: 'user_message', text: 'two' },
      ]),
    )
    expect(history).toEqual([{ role: 'user', text: 'one' }])
  })
})
