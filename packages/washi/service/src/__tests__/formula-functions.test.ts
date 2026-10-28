import { afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test'
import { deleteSheet, openWorkspace, type Workspace } from '@washi/repository'
import { loadEngine } from '../scripts/engine'
import { installFormulaFunctions } from '../scripts/formulas'
import { createSheetFromSource } from '../sheets/service'
import { defineUserTable, runMutation, runQuery } from '../tables/service'

let ws: Workspace
beforeAll(async () => {
  await loadEngine()
})
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  installFormulaFunctions(ws)
})
afterEach(() => ws.close())

const define = (name: string, code: string) =>
  createSheetFromSource(ws, {
    title: 'Functions',
    source: `<Sheet title="Functions"><Formula name="${name}">{\`${code}\`}</Formula></Sheet>`,
  })

const prices = (expr: string) => {
  defineUserTable(ws, {
    name: 'prices',
    columns: [
      { name: 'item', type: 'text' },
      { name: 'price', type: 'number' },
      { name: 'gross', type: 'formula', expr },
    ],
  })
  runMutation(ws, { kind: 'insert', table: 'prices', data: { item: 'Tea', price: 10 } }, 'p1')
  return () => runQuery(ws, { table: 'prices' }).rows[0]?.gross
}

describe('formula functions', () => {
  test('a formula column calls the workspace’s own function by name', () => {
    define(
      'with_tax',
      'function with_tax(amount: number, rate = 0.19) { return Math.round(amount * (1 + rate) * 100) / 100 }',
    )
    expect(prices('with_tax(price)')()).toBe(11.9)
  })

  test('a name the workspace never defined is refused at definition, in words', () => {
    define('with_tax', 'function with_tax(x) { return x }')
    expect(() => prices('wtih_tax(price)')).toThrow(
      /unknown function `wtih_tax` — the workspace's functions: `with_tax`/,
    )
  })

  test('a function whose page went to the trash reads as empty, never as an error', () => {
    const page = define('with_tax', 'function with_tax(x) { return x * 2 }')
    const gross = prices('with_tax(price)')
    expect(gross()).toBe(20)
    deleteSheet(ws, page.id)
    expect(gross()).toBeNull()
  })

  test('a runaway function is stopped; that cell reads empty and the query still answers', () => {
    define('spin', 'function spin(x) { while (true) {} }')
    expect(prices('spin(price)')()).toBeNull()
  })

  test('it gets values and gives one back: no rows, no state, no network', () => {
    define('probe', 'function probe() { return [typeof fetch, typeof rows, typeof act].join(",") }')
    expect(prices('probe()')()).toBe('undefined,undefined,undefined')
  })
})
