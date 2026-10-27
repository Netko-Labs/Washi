import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { openWorkspace, type Workspace } from '@washi/repository'
import { defineUserTable, runMutation, runQuery, toggleTaskRecord } from '../tables/service'

let ws: Workspace
let billId: string
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  defineUserTable(ws, {
    name: 'bills',
    columns: [
      { name: 'name', type: 'text' },
      { name: 'paid', type: 'boolean' },
      { name: 'amount', type: 'number' },
    ],
  })
  runMutation(ws, { kind: 'insert', table: 'bills', data: { name: 'Water', paid: false } })
  billId = String(runQuery(ws, { table: 'bills' }).rows[0]?.id)
})
afterEach(() => ws.close())

const paidOf = () => runQuery(ws, { table: 'bills' }).rows[0]?.paid

describe('a Task ticks the column it names', () => {
  test('field="paid" saves paid — not a done nobody reads', () => {
    toggleTaskRecord(ws, billId, true, 'paid')
    expect(paidOf()).toBe(true)
    expect(runQuery(ws, { table: 'bills' }).rows[0]?.done).toBeUndefined()
  })

  test('a named column must be a checkbox, said in words', () => {
    expect(() => toggleTaskRecord(ws, billId, true, 'amount')).toThrow('not a checkbox column')
    expect(() => toggleTaskRecord(ws, billId, true, 'payd')).toThrow('not a checkbox column')
  })

  test('a bare Task names nothing and is never refused, even where no done column exists', () => {
    expect(() => toggleTaskRecord(ws, billId, true)).not.toThrow()
    expect(paidOf()).toBe(false)
  })
})
