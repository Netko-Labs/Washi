import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { openWorkspace, type Workspace } from '@washi/repository'
import { linkColumn } from '../tables/link'
import { defineUserTable, runMutation, runQuery } from '../tables/service'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  defineUserTable(ws, {
    name: 'expenses',
    columns: [
      { name: 'name', type: 'text' },
      { name: 'category', type: 'text' },
      { name: 'amount', type: 'number' },
    ],
  })
  defineUserTable(ws, {
    name: 'categories',
    columns: [
      { name: 'name', type: 'text' },
      {
        name: 'spent',
        type: 'rollup',
        rollup: { table: 'expenses', via: 'category', fn: 'sum', column: 'amount' },
      },
    ],
  })
  for (const name of ['Health', 'Pets']) {
    runMutation(ws, { kind: 'insert', table: 'categories', data: { name } })
  }
  for (const [name, category, amount] of [
    ['Insurance', 'Health', 1_200_000],
    ['Vet', ' pets ', 300_000],
    ['Trainer', 'Fitness', 680_000],
  ] as const) {
    runMutation(ws, { kind: 'insert', table: 'expenses', data: { name, category, amount } })
  }
})
afterEach(() => ws.close())

const categories = () =>
  Object.fromEntries(runQuery(ws, { table: 'categories' }).rows.map((row) => [row.name, row]))

describe('linking a choice column (D74)', () => {
  test('refuses and lists what nothing matches, changing nothing', () => {
    expect(() =>
      linkColumn(ws, { table: 'expenses', column: 'category', target: 'categories' }),
    ).toThrow('"Fitness"')
    expect(runQuery(ws, { table: 'expenses' }).rows[0]?.category).toBe('Health')
  })

  test('with create, every value becomes an id, matched ignoring case and spaces', () => {
    const result = linkColumn(ws, {
      table: 'expenses',
      column: 'category',
      target: 'categories',
      create: true,
    })
    expect(result).toEqual({ linked: 3, created: ['Fitness'] })
    const all = categories()
    expect(all.Fitness).toMatchObject({ spent: 680_000 })
    expect(all.Pets).toMatchObject({ spent: 300_000 })
    const vet = runQuery(ws, { table: 'expenses' }).rows.find((row) => row.name === 'Vet')
    expect(vet?.category).toEqual([all.Pets?.id])
  })

  test('a rename then reaches every row, because the cell holds the id', () => {
    linkColumn(ws, { table: 'expenses', column: 'category', target: 'categories', create: true })
    const healthId = String(categories().Health?.id)
    runMutation(ws, {
      kind: 'update',
      table: 'categories',
      where: [{ column: 'id', op: 'eq', value: healthId }],
      data: { name: 'Health & Fitness' },
    })
    expect(categories()['Health & Fitness']).toMatchObject({ spent: 1_200_000 })
  })
})
