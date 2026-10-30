import { describe, expect, test } from 'bun:test'
import type { AgentUpdate, TranscriptEntry } from '@washi/domain'
import { conversationHistory, followsStop } from '../agents/history'

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

describe('an ask after Stop is told so', () => {
  const searching: AgentUpdate = {
    kind: 'tool_call',
    toolCallId: 't',
    title: 'web_search',
    toolKind: 'search',
    status: 'in_progress',
  }

  test('the turn just before was stopped', () => {
    const stopped = transcript([
      { kind: 'user_message', text: 'search twice' },
      searching,
      { kind: 'turn_done', stopReason: 'cancelled' },
      { kind: 'user_message', text: 'again' },
    ])
    expect(followsStop(stopped)).toBe(true)
  })

  test('only the turn just before counts', () => {
    const later = transcript([
      { kind: 'user_message', text: 'one' },
      { kind: 'turn_done', stopReason: 'cancelled' },
      { kind: 'user_message', text: 'two' },
      { kind: 'turn_done', stopReason: 'end_turn' },
      { kind: 'user_message', text: 'three' },
    ])
    expect(followsStop(later)).toBe(false)
    expect(followsStop(transcript([{ kind: 'user_message', text: 'first' }]))).toBe(false)
  })
})
