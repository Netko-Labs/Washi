import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { appendTurn, createSession, openWorkspace, type Workspace } from '@washi/repository'
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

  test('outside the window is not today', () => {
    const session = createSession(ws, 'Old')
    appendTurn(ws, session.id, { kind: 'user_message', text: 'hi' })
    appendTurn(ws, session.id, { kind: 'turn_done', stopReason: 'end_turn' })
    expect(recentTurns(ws, Date.now() + 2 * 24 * 60 * 60_000)).toEqual([])
  })

  test('an HLC reads back as its wall clock', () => {
    expect(hlcMs('00001791437603024-0001-abcd')).toBe(1791437603024)
    expect(hlcMs('garbage')).toBe(0)
  })
})
