import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { openWorkspace, type Workspace } from '@washi/repository'
import { rowActivity } from '../tables/activity'
import { changeColumn } from '../tables/columns'
import { defineUserTable, runMutation, runQuery } from '../tables/service'

let ws: Workspace
let first: string
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  defineUserTable(ws, {
    name: 'orders',
    columns: [
      { name: 'name', type: 'text' },
      { name: 'qty', type: 'number' },
      { name: 'price', type: 'number' },
      { name: 'stage', type: 'select', options: ['Lead', 'Won'] },
      { name: 'tags', type: 'multi_select', options: ['red', 'blue'] },
      { name: 'total', type: 'formula', expr: 'qty * price' },
    ],
  })
  first =
    runMutation(ws, {
      kind: 'insert',
      table: 'orders',
      data: { name: 'Atlas', qty: 2, price: 5, stage: 'Lead', tags: ['red', 'blue'] },
    }).id ?? ''
  runMutation(ws, { kind: 'insert', table: 'orders', data: { name: 'Borealis', stage: 'Won' } })
})
afterEach(() => ws.close())

const rows = () => runQuery(ws, { table: 'orders' }).rows
const atlas = () => rows().find((row) => row.name === 'Atlas')
const dropFormula = () => changeColumn(ws, { kind: 'remove', table: 'orders', column: 'total' })

describe('a column menu’s changes', () => {
  test('a rename a formula reads is refused, in the server’s words, and changes nothing', () => {
    expect(() =>
      changeColumn(ws, { kind: 'rename', table: 'orders', column: 'qty', to: 'quantity' }),
    ).toThrow('The formula “total” reads “qty” — change it first.')
    expect(atlas()?.qty).toBe(2)
  })

  test('any other refusal keeps its own words, even beside a formula that names the column', () => {
    defineUserTable(ws, { name: 'lines', columns: [{ name: 'order_qty', type: 'number' }] })
    defineUserTable(ws, {
      name: 'orders',
      columns: [
        { name: 'name', type: 'text' },
        { name: 'qty', type: 'number' },
        { name: 'label', type: 'formula', expr: "when(true, 'qty', '')" },
        {
          name: 'pieces',
          type: 'rollup',
          rollup: { table: 'lines', via: 'order_qty', on: 'qty', fn: 'count' },
        },
      ],
    })
    expect(() =>
      changeColumn(ws, { kind: 'rename', table: 'orders', column: 'qty', to: 'quantity' }),
    ).toThrow('pieces: "qty" is not a stored column to match on')
    expect(atlas()?.qty).toBe(2)
  })

  test('a rename carries the values, and history says who moved them', () => {
    dropFormula()
    const change = { kind: 'rename', table: 'orders', column: 'qty', to: 'count' } as const
    expect(changeColumn(ws, change, 'm1').moved).toBe(1)
    expect(atlas()).toMatchObject({ count: 2 })
    expect(rowActivity(ws, first).changes[0]?.by).toBe('m1')
  })

  test('a deleted property takes its values; the title stays', () => {
    dropFormula()
    changeColumn(ws, { kind: 'remove', table: 'orders', column: 'qty' })
    expect(atlas()?.qty ?? null).toBeNull()
    expect(() => changeColumn(ws, { kind: 'remove', table: 'orders', column: 'name' })).toThrow(
      'title',
    )
  })

  test('a removed option empties the rows that held it; a renamed one renames them', () => {
    expect(
      changeColumn(ws, { kind: 'option', table: 'orders', column: 'stage', from: 'Lead' }).moved,
    ).toBe(1)
    expect(atlas()?.stage ?? null).toBeNull()
    changeColumn(ws, {
      kind: 'option',
      table: 'orders',
      column: 'tags',
      from: 'red',
      to: 'crimson',
    })
    expect(atlas()?.tags).toEqual(['crimson', 'blue'])
  })

  test('a column another table rolls up is not renamed out from under it', () => {
    defineUserTable(ws, {
      name: 'stages',
      columns: [
        { name: 'name', type: 'text' },
        {
          name: 'pieces',
          type: 'rollup',
          rollup: { table: 'orders', via: 'stage', fn: 'sum', column: 'price' },
        },
      ],
    })
    expect(() => changeColumn(ws, { kind: 'remove', table: 'orders', column: 'price' })).toThrow(
      'the rollup “pieces” on stages',
    )
  })
})
