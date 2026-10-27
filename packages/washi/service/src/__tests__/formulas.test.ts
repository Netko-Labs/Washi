import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { openWorkspace, type Workspace } from '@washi/repository'
import { defineUserTable, runMutation, runQuery } from '../tables/service'

let ws: Workspace
const DAY = 86_400_000
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  defineUserTable(ws, {
    name: 'expenses',
    columns: [
      { name: 'name', type: 'text' },
      { name: 'date', type: 'date' },
      { name: 'usd', type: 'number' },
      { name: 'fx_rate', type: 'number' },
      { name: 'paid', type: 'boolean' },
      { name: 'month', type: 'formula', expr: 'month(date)' },
      { name: 'cop', type: 'formula', expr: 'usd * fx_rate' },
      { name: 'overdue', type: 'formula', expr: 'when(paid, false, days(now(), date) < 0)' },
    ],
  })
  const iso = (offsetDays: number) =>
    new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10)
  for (const [name, date, usd, paid] of [
    ['Claude', '2026-10-01', 200, true],
    ['Water', iso(-3), 30, false],
    ['Gym', '2026-11-01', 50, false],
  ] as const) {
    runMutation(ws, {
      kind: 'insert',
      table: 'expenses',
      data: { name, date, usd, fx_rate: 4000, paid },
    })
  }
})
afterEach(() => ws.close())

const names = (rows: Record<string, unknown>[]) => rows.map((row) => row.name)

describe('formula columns (D73)', () => {
  test('are computed on read: month from the date, COP from the rate, overdue from both', () => {
    const rows = runQuery(ws, { table: 'expenses' }).rows
    const claude = rows.find((row) => row.name === 'Claude')
    expect(claude?.month).toBe('2026-10')
    expect(claude?.cop).toBe(800_000)
    expect(rows.find((row) => row.name === 'Water')?.overdue).toBe(true)
    expect(claude?.overdue).toBe(false)
  })

  test('filter, order and group on a formula like on any column', () => {
    const november = runQuery(ws, {
      table: 'expenses',
      where: [{ column: 'month', op: 'eq', value: '2026-11' }],
    })
    expect(names(november.rows)).toEqual(['Gym'])
    const byCop = runQuery(ws, { table: 'expenses', orderBy: { column: 'cop', direction: 'desc' } })
    expect(names(byCop.rows)[0]).toBe('Claude')
    const perMonth = runQuery(ws, {
      table: 'expenses',
      where: [{ column: 'paid', op: 'eq', value: false }],
      groupBy: { column: 'month', aggregates: [{ fn: 'sum', column: 'cop' }, { fn: 'count' }] },
    })
    const november2 = perMonth.rows.find((row) => row.month === '2026-11')
    expect(november2).toEqual({ month: '2026-11', sum_cop: 200_000, count: 1 })
  })

  test('cannot be written, and a bad formula is refused when the table is defined', () => {
    expect(() =>
      runMutation(ws, { kind: 'insert', table: 'expenses', data: { name: 'x', month: '2026-12' } }),
    ).toThrow('computed from its formula')
    expect(() =>
      defineUserTable(ws, {
        name: 'broken',
        columns: [
          { name: 'a', type: 'number' },
          { name: 'b', type: 'formula', expr: 'a * missing' },
        ],
      }),
    ).toThrow('b: ')
    expect(() =>
      defineUserTable(ws, {
        name: 'rollup_in_disguise',
        columns: [
          { name: 'a', type: 'number' },
          { name: 'b', type: 'formula', expr: 'sum(expenses.usd)' },
        ],
      }),
    ).toThrow('b: ')
  })

  test('an update filtered on a formula touches exactly those rows', () => {
    runMutation(ws, {
      kind: 'update',
      table: 'expenses',
      where: [{ column: 'month', op: 'eq', value: '2026-11' }],
      data: { paid: true },
    })
    const paid = runQuery(ws, {
      table: 'expenses',
      where: [{ column: 'paid', op: 'eq', value: true }],
    })
    expect(names(paid.rows).sort()).toEqual(['Claude', 'Gym'])
  })
})
