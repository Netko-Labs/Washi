import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { appendTurn, createSession, openWorkspace, type Workspace } from '@washi/repository'
import { plainLine } from '../agents/lib'
import { hlcMs, recentTurns } from '../agents/today'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'today', path: ':memory:' })
})
afterEach(() => ws.close())

describe('today retells each turn: the ask, what it touched, the receipt', () => {
  test('turns group by their prompt, tools dedupe, newest first', () => {
    const session = createSession(ws, 'Launch')
    appendTurn(ws, session.id, { kind: 'user_message', text: 'make a launch page' })
    for (const title of ['sheet_check', 'sheet_check', 'sheet_create']) {
      appendTurn(ws, session.id, {
        kind: 'tool_call',
        toolCallId: title,
        title,
        toolKind: 'edit',
        status: 'in_progress',
      })
    }
    appendTurn(ws, session.id, {
      kind: 'turn_done',
      stopReason: 'end_turn',
      billing: 'plan',
      costUsd: 0.03,
    })
    appendTurn(ws, session.id, { kind: 'user_message', text: 'now a pricing table' })
    appendTurn(ws, session.id, { kind: 'turn_done', stopReason: 'cancelled' })

    const turns = recentTurns(ws)
    expect(turns.map((turn) => turn.prompt)).toEqual(['now a pricing table', 'make a launch page'])
    expect(turns[1]?.tools).toEqual(['sheet_check', 'sheet_create'])
    expect(turns[1]?.receipt).toMatchObject({ billing: 'plan', costUsd: 0.03 })
    expect(turns[0]?.tools).toEqual([])
  })

  test('a turn comes to the last page it wrote, else the first line it said, plain', () => {
    const session = createSession(ws, 'Trip')
    appendTurn(ws, session.id, { kind: 'user_message', text: 'plan **Kyoto**' })
    appendTurn(ws, session.id, { kind: 'message_chunk', text: 'On it.' })
    appendTurn(ws, session.id, {
      kind: 'tool_call',
      toolCallId: 'c1',
      title: 'sheet_create',
      toolKind: 'edit',
      status: 'pending',
      input: { title: 'Kyoto' },
    })
    appendTurn(ws, session.id, {
      kind: 'tool_call_update',
      toolCallId: 'c1',
      status: 'completed',
      output: '{"id":"p1","title":"Kyoto"}',
    })
    appendTurn(ws, session.id, { kind: 'turn_done', stopReason: 'end_turn' })
    appendTurn(ws, session.id, { kind: 'user_message', text: 'what is `due`?' })
    appendTurn(ws, session.id, { kind: 'message_chunk', text: '## **Due** is the `date`' })
    appendTurn(ws, session.id, { kind: 'message_chunk', text: ' a task ends.\n\nMore.' })
    appendTurn(ws, session.id, { kind: 'turn_done', stopReason: 'end_turn' })
    appendTurn(ws, session.id, { kind: 'user_message', text: 'stop' })
    appendTurn(ws, session.id, { kind: 'turn_done', stopReason: 'cancelled' })

    const [stopped, reply, made] = recentTurns(ws)
    expect(made?.outcome).toEqual({ kind: 'page', touch: 'made', id: 'p1', title: 'Kyoto' })
    expect(reply?.outcome).toEqual({ kind: 'reply', text: 'Due is the date a task ends.' })
    expect(stopped?.outcome).toBeNull()
  })

  test('a turn that trashed a table comes to that table (D121)', () => {
    const session = createSession(ws, 'Cleanup')
    appendTurn(ws, session.id, { kind: 'user_message', text: 'trash the issues table' })
    appendTurn(ws, session.id, {
      kind: 'tool_call',
      toolCallId: 't1',
      title: 'db_trash_table',
      toolKind: 'delete',
      status: 'pending',
      input: { table: 'issues' },
    })
    appendTurn(ws, session.id, {
      kind: 'tool_call_update',
      toolCallId: 't1',
      status: 'completed',
      output: '{"id":"tb1","name":"issues","rows":3,"shownOn":[]}',
    })
    appendTurn(ws, session.id, { kind: 'turn_done', stopReason: 'end_turn' })
    expect(recentTurns(ws)[0]?.outcome).toEqual({
      kind: 'table',
      touch: 'trashed',
      id: 'tb1',
      name: 'issues',
    })
  })

  test('a reply reads as one plain line, cut to fit', () => {
    expect(plainLine('- [Roadmap](washi://p1) has *three* __open__ items', 140)).toBe(
      'Roadmap has three open items',
    )
    expect(plainLine('\n\n> quoted', 140)).toBe('quoted')
    expect(plainLine('a long line of words', 10)).toBe('a long li…')
    expect(plainLine('  \n ', 140)).toBeNull()
  })

  test('outside the window is not today', () => {
    const session = createSession(ws, 'Old')
    appendTurn(ws, session.id, { kind: 'user_message', text: 'hi' })
    appendTurn(ws, session.id, { kind: 'turn_done', stopReason: 'end_turn' })
    expect(recentTurns(ws, undefined, Date.now() + 2 * 24 * 60 * 60_000)).toEqual([])
  })

  test('an HLC reads back as its wall clock', () => {
    expect(hlcMs('00001791437603024-0001-abcd')).toBe(1791437603024)
    expect(hlcMs('garbage')).toBe(0)
  })
})
