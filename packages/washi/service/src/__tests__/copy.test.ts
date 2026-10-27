import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import type { InkMutation, RecordData } from '@washi/ink'
import { openWorkspace, type Workspace } from '@washi/repository'
import { defineUserTable, runMutation, runQuery } from '../tables/service'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  defineUserTable(ws, {
    name: 'expenses',
    columns: [
      { name: 'name', type: 'text' },
      { name: 'date', type: 'date' },
      { name: 'amount', type: 'number' },
      { name: 'recurring', type: 'boolean' },
      { name: 'every_n_months', type: 'number' },
      { name: 'paid', type: 'boolean' },
      { name: 'note', type: 'text' },
      { name: 'month', type: 'formula', expr: 'month(date)' },
      {
        name: 'next_date',
        type: 'formula',
        expr: 'add_months(date, when(every_n_months > 0, every_n_months, 1))',
      },
      { name: 'next_month', type: 'formula', expr: 'month(next_date)' },
    ],
  })
  const add = (data: RecordData) => runMutation(ws, { kind: 'insert', table: 'expenses', data })
  add({ name: 'Rent', date: '2026-10-01', amount: 900, recurring: true, every_n_months: 1 })
  add({ name: 'Netflix', date: '2026-10-31', amount: 15, recurring: true, paid: true })
  add({ name: 'Water', date: '2026-09-15', amount: 40, recurring: true, every_n_months: 2 })
  add({ name: 'Water', date: '2026-07-15', amount: 38, recurring: true, every_n_months: 2 })
  add({ name: 'Groceries', date: '2026-10-12', amount: 120, recurring: false })
})
afterEach(() => ws.close())

const ROLLOVER: InkMutation = {
  kind: 'copy',
  table: 'expenses',
  params: { month: '2026-11' },
  where: [
    { column: 'recurring', op: 'eq', value: true },
    { column: 'next_month', op: 'eq', value: { param: 'month' } },
  ],
  set: { date: { expr: 'next_date' }, paid: false },
}

const monthOf = (month: string) =>
  runQuery(ws, {
    table: 'expenses',
    where: [{ column: 'month', op: 'eq', value: month }],
    orderBy: { column: 'name', direction: 'asc' },
  }).rows
const count = () => runQuery(ws, { table: 'expenses' }).rows.length

describe('copy (D76)', () => {
  test('rolls every recurring row whose cadence lands in the picked month into it', () => {
    const result = runMutation(ws, ROLLOVER)
    expect(result.affected).toBe(3)
    expect(result.ids).toHaveLength(3)
    const november = monthOf('2026-11')
    expect(november.map((row) => [row.name, row.date, row.amount, row.paid])).toEqual([
      ['Netflix', '2026-11-30', 15, false],
      ['Rent', '2026-11-01', 900, false],
      ['Water', '2026-11-15', 40, false],
    ])
    expect(november.map((row) => row.id)).toEqual(expect.arrayContaining(result.ids ?? []))
    expect(monthOf('2026-10')).toHaveLength(3)
  })

  test('each copy is a row of its own history', () => {
    const before = ws.sqlite.query('SELECT count(*) AS n FROM record_changes').get() as {
      n: number
    }
    const { ids = [] } = runMutation(ws, ROLLOVER)
    const placeholders = ids.map(() => '?').join(', ')
    const logged = ws.sqlite
      .query(`SELECT record_id FROM record_changes WHERE record_id IN (${placeholders})`)
      .all(...ids)
    expect(logged).toHaveLength(3)
    const after = ws.sqlite.query('SELECT count(*) AS n FROM record_changes').get() as {
      n: number
    }
    expect(after.n - before.n).toBe(3)
  })

  test('a set expr reads its params as $name', () => {
    runMutation(ws, { ...ROLLOVER, set: { ...ROLLOVER.set, note: { expr: "'from ' + $month" } } })
    expect(monthOf('2026-11').map((row) => row.note)).toEqual([
      'from 2026-11',
      'from 2026-11',
      'from 2026-11',
    ])
  })

  test('refuses to write a computed column, an unknown one, or an expr that does not read', () => {
    expect(() => runMutation(ws, { ...ROLLOVER, set: { month: '2026-11' } })).toThrow(
      'computed from its formula',
    )
    expect(() => runMutation(ws, { ...ROLLOVER, set: { due: '2026-11-01' } })).toThrow(
      'unknown column "due"',
    )
    expect(() =>
      runMutation(ws, { ...ROLLOVER, set: { date: { expr: 'add_months(dat, 1)' } } }),
    ).toThrow('unknown identifier `dat`')
    expect(count()).toBe(5)
  })

  test('an unset param refuses instead of widening the match', () => {
    expect(() => runMutation(ws, { ...ROLLOVER, params: {} })).toThrow(
      '"month", which has no value',
    )
    expect(count()).toBe(5)
  })

  test('past the cap nothing is copied, and the refusal says so', () => {
    expect(() => runMutation(ws, { ...ROLLOVER, limit: 2 })).toThrow('more than 2 rows match')
    expect(count()).toBe(5)
  })

  test('a copy that fails validation lands no row at all', () => {
    expect(() => runMutation(ws, { ...ROLLOVER, set: { date: { expr: "'soon'" } } })).toThrow(
      'expected an ISO date',
    )
    expect(count()).toBe(5)
  })
})
