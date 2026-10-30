import { describe, expect, test } from 'bun:test'
import type { AgentUpdate, SheetSummary, TranscriptEntry, UserTable } from '@washi/domain'
import {
  chatBlocks,
  createdId,
  greetingFor,
  isNearBottom,
  receiptSummary,
  startersFor,
  trashedPages,
} from '../utils'
import { GENERIC_STARTERS } from '../values'

let seq = 0
const entry = (update: AgentUpdate): TranscriptEntry => {
  seq += 1
  return { id: `e${seq}`, seq, update, createdAt: '' }
}

const sheet = (id: string, title: string, hlcUpdated: string, rowOf: string | null = null) =>
  ({ id, title, hlcUpdated, rowOf }) as SheetSummary

const table = (name: string, hlcUpdated: string) => ({ id: name, name, hlcUpdated }) as UserTable

describe('chat blocks', () => {
  test('a move to another page is a divider in the turn that made it (D110)', () => {
    const [, turn] = chatBlocks([
      entry({ kind: 'user_message', text: 'Make a Lisbon plan' }),
      entry({ kind: 'message_chunk', text: 'Moving us there.' }),
      entry({ kind: 'handoff', from: 'trip', to: 'lisbon', title: 'Lisbon', by: 'washi' }),
    ])
    expect(turn?.kind === 'washi' && turn.parts.map((part) => part.kind)).toEqual([
      'text',
      'handoff',
    ])
  })

  test('asks and turns alternate; tool runs fold, text merges, pages are carded', () => {
    const blocks = chatBlocks([
      entry({ kind: 'user_message', text: 'Plan Kyoto' }),
      entry({ kind: 'message_chunk', text: 'On ' }),
      entry({ kind: 'message_chunk', text: 'it.' }),
      entry({
        kind: 'tool_call',
        toolCallId: 't1',
        title: 'sheet_list',
        toolKind: 'read',
        status: 'in_progress',
      }),
      entry({
        kind: 'tool_call',
        toolCallId: 't2',
        title: 'sheet_create',
        toolKind: 'edit',
        status: 'in_progress',
        input: { title: 'Kyoto' },
      }),
      entry({ kind: 'tool_call_update', toolCallId: 't1', status: 'completed', output: '[]' }),
      entry({
        kind: 'tool_call_update',
        toolCallId: 't2',
        status: 'completed',
        output: '{"id":"p1","title":"Kyoto"}',
      }),
      entry({
        kind: 'tool_call',
        toolCallId: 't3',
        title: 'sheet_replace',
        toolKind: 'edit',
        status: 'in_progress',
        input: { id: 'p1', title: 'Kyoto' },
      }),
      entry({ kind: 'tool_call_update', toolCallId: 't3', status: 'completed' }),
      entry({ kind: 'message_chunk', text: 'Done.' }),
      entry({ kind: 'turn_done', stopReason: 'end_turn' }),
      entry({ kind: 'user_message', text: 'Thanks' }),
    ])
    expect(blocks.map((block) => block.kind)).toEqual(['person', 'washi', 'person'])
    const turn = blocks[1]
    if (turn?.kind !== 'washi') throw new Error('no turn')
    expect(turn.parts.map((part) => part.kind)).toEqual(['text', 'tools', 'text'])
    expect(turn.parts[0]).toMatchObject({ text: 'On it.' })
    const tools = turn.parts[1]
    expect(tools?.kind === 'tools' && tools.steps.map((step) => step.status)).toEqual([
      'completed',
      'completed',
      'completed',
    ])
    expect(turn.pages).toEqual([{ id: 'p1', title: 'Kyoto', touch: 'made' }])
  })

  test('a failed or stopped turn says so; an unfinished write is no card', () => {
    const blocks = chatBlocks([
      entry({
        kind: 'tool_call',
        toolCallId: 'x',
        title: 'sheet_replace',
        toolKind: 'edit',
        status: 'in_progress',
        input: { id: 'p2', title: 'Notes' },
      }),
      entry({ kind: 'turn_done', stopReason: 'cancelled' }),
      entry({ kind: 'turn_done', stopReason: 'error', error: 'No key' }),
    ])
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toMatchObject({ pages: [] })
    expect(blocks[0]?.kind === 'washi' && blocks[0].parts.at(-1)?.kind).toBe('stopped')
    expect(blocks[1]).toMatchObject({ parts: [{ kind: 'error', text: 'No key' }] })
  })

  test('the made page id comes off the output, JSON or not', () => {
    expect(createdId('{"id":"a"}')).toBe('a')
    expect(createdId('saved {"id": "b", "x": 1')).toBe('b')
    expect(createdId(null)).toBeNull()
  })
})

describe('receipts', () => {
  test('two shown, the rest counted', () => {
    expect(receiptSummary(['Read A', 'Searched the web', 'Read B', 'Read C'])).toEqual({
      head: 'Read A · Searched the web',
      more: 2,
    })
    expect(receiptSummary(['Read A'])).toEqual({ head: 'Read A', more: 0 })
  })
})

describe('starters', () => {
  test('named off the newest pages and table, never a row page', () => {
    const starters = startersFor(
      [
        sheet('old', 'Old notes', '0001'),
        sheet('row', 'A row', '0009', 'tasks'),
        sheet('new', 'Trip Plan', '0005'),
      ],
      [table('issues', '0002'), table('tasks', '0003')],
    )
    expect(starters.map((starter) => starter.label)).toEqual([
      'Summarize Trip Plan',
      'What changed in tasks this week?',
      'What links to Old notes?',
      'Make a page for …',
    ])
    expect(starters[0]?.attachments).toEqual([{ kind: 'page', id: 'new', name: 'Trip Plan' }])
    expect(starters[3]?.sends).toBe(false)
  })

  test('an empty workspace gets plain asks', () => {
    expect(startersFor([], [])).toEqual(GENERIC_STARTERS)
  })

  test('the greeting uses a first name only when there is one', () => {
    expect(greetingFor('Juan Camilo')).toBe('What should we work on, Juan?')
    expect(greetingFor('  ')).toBe('What should we work on?')
  })
})

describe('stick to bottom', () => {
  test('near the end counts as at the end', () => {
    expect(isNearBottom({ scrollTop: 560, scrollHeight: 1000, clientHeight: 400 })).toBe(true)
    expect(isNearBottom({ scrollTop: 300, scrollHeight: 1000, clientHeight: 400 })).toBe(false)
  })
})

describe('trashed pages', () => {
  test('only a finished delete offers Restore', () => {
    const step = (status: 'completed' | 'failed' | 'in_progress', id: string) => ({
      id,
      name: 'sheet_delete',
      input: { id },
      status,
      output: null,
    })
    expect(
      trashedPages([
        step('completed', 'a'),
        step('failed', 'b'),
        step('in_progress', 'c'),
        { ...step('completed', 'd'), name: 'sheet_get' },
      ]),
    ).toEqual(['a'])
  })
})
