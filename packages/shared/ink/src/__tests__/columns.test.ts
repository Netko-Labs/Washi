import { describe, expect, test } from 'bun:test'
import { type ColumnChange, changedSpec, rowPatch, type TableSpec } from '../index'

const orders: TableSpec = {
  name: 'orders',
  columns: [
    { name: 'name', type: 'text' },
    { name: 'qty', type: 'number' },
    { name: 'stage', type: 'select', options: ['Lead', 'Won'] },
    { name: 'tags', type: 'multi_select', options: ['red', 'blue'] },
    {
      name: 'state',
      type: 'status',
      groups: { todo: ['Not started'], doing: ['In progress'], done: ['Done'] },
    },
    { name: 'double', type: 'formula', expr: 'qty * 2' },
  ],
}

const column = (name: string) => orders.columns.find((each) => each.name === name)!
const specAfter = (change: ColumnChange) => {
  const result = changedSpec(orders, change)
  if (!result.ok) throw new Error(result.error)
  return result.spec
}
const refusal = (change: ColumnChange) => {
  const result = changedSpec(orders, change)
  return result.ok ? null : result.error
}

describe('renaming a property', () => {
  test('renames it in place, and its values move with it', () => {
    const spec = specAfter({ kind: 'rename', table: 'orders', column: 'qty', to: 'quantity' })
    expect(spec.columns[1]).toEqual({ name: 'quantity', type: 'number' })
    const change = { kind: 'rename', table: 'orders', column: 'qty', to: 'quantity' } as const
    expect(rowPatch(column('qty'), change, { qty: 3 })).toEqual({ quantity: 3, qty: null })
    expect(rowPatch(column('qty'), change, { name: 'a' })).toBeNull()
  })

  test('refuses a name already taken', () => {
    expect(refusal({ kind: 'rename', table: 'orders', column: 'qty', to: 'stage' })).toBe(
      '“stage” is already a property.',
    )
  })

  test('moves nothing for a computed column', () => {
    const change = { kind: 'rename', table: 'orders', column: 'double', to: 'twice' } as const
    expect(rowPatch(column('double'), change, { double: 6 })).toBeNull()
  })
})

describe('deleting a property', () => {
  test('drops the column and empties its values', () => {
    const change = { kind: 'remove', table: 'orders', column: 'qty' } as const
    expect(specAfter(change).columns.map((each) => each.name)).not.toContain('qty')
    expect(rowPatch(column('qty'), change, { qty: 3 })).toEqual({ qty: null })
  })

  test('never the title', () => {
    expect(refusal({ kind: 'remove', table: 'orders', column: 'name' })).toContain('title')
  })
})

describe('editing options', () => {
  test('a renamed option renames every value holding it', () => {
    const change = { kind: 'option', table: 'orders', column: 'stage', from: 'Lead', to: 'Open' }
    expect(specAfter(change as ColumnChange).columns[2]?.options).toEqual(['Open', 'Won'])
    expect(rowPatch(column('stage'), change as ColumnChange, { stage: 'Lead' })).toEqual({
      stage: 'Open',
    })
    expect(rowPatch(column('stage'), change as ColumnChange, { stage: 'Won' })).toBeNull()
  })

  test('a removed option leaves the rows that held it empty, and lists without it', () => {
    const select = { kind: 'option', table: 'orders', column: 'stage', from: 'Lead' } as const
    expect(rowPatch(column('stage'), select, { stage: 'Lead' })).toEqual({ stage: null })
    const multi = { kind: 'option', table: 'orders', column: 'tags', from: 'red' } as const
    expect(rowPatch(column('tags'), multi, { tags: ['red', 'blue'] })).toEqual({ tags: ['blue'] })
    expect(rowPatch(column('tags'), multi, { tags: ['red'] })).toEqual({ tags: null })
  })

  test('a status takes a new option into the group named, to-do by default', () => {
    const spec = specAfter({
      kind: 'option',
      table: 'orders',
      column: 'state',
      to: 'Shipped',
      group: 'done',
    })
    expect(spec.columns[4]?.groups?.done).toEqual(['Done', 'Shipped'])
  })

  test('an option renamed to itself changes nothing', () => {
    const change = { kind: 'option', table: 'orders', column: 'stage', from: 'Lead', to: 'Lead' }
    expect(specAfter(change as ColumnChange)).toBe(orders)
  })

  test('refuses a duplicate, a stranger, a last option and an emptied status group', () => {
    expect(refusal({ kind: 'option', table: 'orders', column: 'stage', to: 'Won' })).toBe(
      '“Won” is already an option.',
    )
    expect(refusal({ kind: 'option', table: 'orders', column: 'stage', from: 'Gone' })).toBe(
      '“Gone” is not an option.',
    )
    expect(refusal({ kind: 'option', table: 'orders', column: 'qty', to: 'x' })).toContain(
      'Only a select',
    )
    expect(refusal({ kind: 'option', table: 'orders', column: 'state', from: 'Done' })).toContain(
      'at least one',
    )
  })
})
