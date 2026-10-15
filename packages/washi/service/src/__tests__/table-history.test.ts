import { afterEach, beforeEach, describe, expect, setSystemTime, test } from 'bun:test'
import { openWorkspace, type Workspace } from '@washi/repository'
import { runHistory } from '../tables/history'
import {
  defineUserTable,
  deleteRecord,
  InkError,
  runMutation,
  updateRecord,
} from '../tables/service'

const DAY = 86_400_000
const START = Date.UTC(2026, 9, 1, 12)
const at = (day: number) => setSystemTime(new Date(START + day * DAY))

let ws: Workspace
beforeEach(() => {
  at(0)
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  defineUserTable(ws, {
    name: 'issues',
    columns: [
      { name: 'title', type: 'text' },
      { name: 'state', type: 'status', groups: { todo: ['Todo'], doing: [], done: ['Done'] } },
      { name: 'labels', type: 'multi_select', options: ['bug'] },
    ],
  })
})
afterEach(() => {
  setSystemTime()
  ws.close()
})

const insert = (title: string, labels: string[] = []) =>
  runMutation(ws, { kind: 'insert', table: 'issues', data: { title, state: 'Todo', labels } }).id ??
  ''

describe('history replays the change log, day by day', () => {
  test('a burn-up: done counts rise when rows move, and a deletion leaves the count', () => {
    const a = insert('a')
    const b = insert('b', ['bug'])
    at(2)
    updateRecord(ws, 'issues', a, { state: 'Done' })
    at(3)
    deleteRecord(ws, 'issues', b)
    at(4)

    const done = runHistory(ws, {
      table: 'issues',
      where: [{ column: 'state', op: 'eq', value: 'Done' }],
      range: '7d',
    }).rows
    expect(done.map((row) => row.count)).toEqual([0, 0, 0, 0, 1, 1, 1])
    expect(done.at(-1)?.day).toBe('2026-10-05')

    const all = runHistory(ws, { table: 'issues', range: '7d' }).rows
    expect(all.map((row) => row.count)).toEqual([0, 0, 2, 2, 2, 1, 1])

    const bugs = runHistory(ws, {
      table: 'issues',
      where: [{ column: 'labels', op: 'contains', value: 'bug' }],
      range: '7d',
    }).rows
    expect(bugs.map((row) => row.count)).toEqual([0, 0, 1, 1, 1, 0, 0])
  })

  test('the same column rules as a query', () => {
    expect(() =>
      runHistory(ws, {
        table: 'issues',
        where: [{ column: 'nope', op: 'eq', value: 1 }],
        range: '7d',
      }),
    ).toThrow(InkError)
    expect(() =>
      runHistory(ws, {
        table: 'issues',
        where: [{ column: 'labels', op: 'gt', value: 'a' }],
        range: '7d',
      }),
    ).toThrow(InkError)
  })
})
