import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { openWorkspace, type Workspace } from '@washi/repository'
import { defineUserTable, runMutation, runQuery } from '../tables/service'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  defineUserTable(ws, {
    name: 'tasks',
    columns: [
      { name: 'title', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'points', type: 'number' },
      { name: 'done', type: 'boolean' },
    ],
  })
  runMutation(ws, {
    kind: 'insert',
    table: 'tasks',
    data: { title: 'a', status: 'open', points: 3, done: false },
  })
  runMutation(ws, {
    kind: 'insert',
    table: 'tasks',
    data: { title: 'b', status: 'open', points: 4, done: true },
  })
})
afterEach(() => ws.close())

/**
 * Every descriptor slot that names a column is a SQL boundary. These cover the
 * slots, not one payload — the original hole was in the one slot nobody checked
 * (spec §09 P0).
 */
describe('ink column identifiers never reach SQL as text', () => {
  const injection = "title') + (SELECT 42) + json_extract(data, '$.title"

  test('groupBy aggregate columns are membership-checked', () => {
    expect(() =>
      runQuery(ws, {
        table: 'tasks',
        groupBy: { column: 'status', aggregates: [{ fn: 'sum', column: injection }] },
      }),
    ).toThrow(/unknown column/)

    expect(() =>
      runQuery(ws, {
        table: 'tasks',
        groupBy: { column: 'status', aggregates: [{ fn: 'sum', column: 'not_a_column' }] },
      }),
    ).toThrow(/unknown column/)
  })

  test('groupBy, where and orderBy columns are membership-checked', () => {
    expect(() =>
      runQuery(ws, {
        table: 'tasks',
        groupBy: { column: injection, aggregates: [{ fn: 'count' }] },
      }),
    ).toThrow(/unknown column/)
    expect(() =>
      runQuery(ws, { table: 'tasks', where: [{ column: injection, op: 'eq', value: 'x' }] }),
    ).toThrow(/unknown column/)
    expect(() =>
      runQuery(ws, { table: 'tasks', orderBy: { column: injection, direction: 'asc' } }),
    ).toThrow(/unknown column/)
  })

  test('mutation filter columns are membership-checked', () => {
    expect(() =>
      runMutation(ws, {
        kind: 'delete',
        table: 'tasks',
        where: [{ column: injection, op: 'eq', value: 'x' }],
      }),
    ).toThrow(/unknown column/)
  })

  test('legitimate queries still work through the bound-path executor', () => {
    const grouped = runQuery(ws, {
      table: 'tasks',
      groupBy: {
        column: 'status',
        aggregates: [{ fn: 'count' }, { fn: 'sum', column: 'points' }],
      },
    })
    expect(grouped.rows).toEqual([{ status: 'open', count: 2, sum_points: 7 }])

    const filtered = runQuery(ws, {
      table: 'tasks',
      where: [{ column: 'points', op: 'gte', value: 4 }],
      orderBy: { column: 'title', direction: 'desc' },
    })
    expect(filtered.rows.map((row) => row.title)).toEqual(['b'])
    expect(filtered.rows[0]?.done).toBe(true)

    const ordered = runQuery(ws, {
      table: 'tasks',
      orderBy: { column: 'points', direction: 'desc' },
    })
    expect(ordered.rows.map((row) => row.title)).toEqual(['b', 'a'])

    const matched = runQuery(ws, {
      table: 'tasks',
      where: [{ column: 'status', op: 'in', value: ['open', 'closed'] }],
    })
    expect(matched.rows).toHaveLength(2)
  })
})
