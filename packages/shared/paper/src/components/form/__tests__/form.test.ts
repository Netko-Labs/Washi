import { describe, expect, test } from 'bun:test'
import type { TableSpec } from '@washi/ink'
import { hasErrors, parse, validate } from '@washi/wsx'
import { paperRegistry } from '../../../registry'
import { formPlan, hasEntries, resolveDefaults, rowOf } from '../lib'

const expenses: TableSpec = {
  name: 'expenses',
  columns: [
    { name: 'name', type: 'text' },
    { name: 'amount', type: 'number' },
    { name: 'category', type: 'select', options: ['Food', 'Rent'] },
    { name: 'date', type: 'date' },
    { name: 'paid', type: 'boolean' },
    { name: 'tags', type: 'multi_select', options: ['work', 'home'] },
    { name: 'month', type: 'formula', expr: 'month(date)' },
    {
      name: 'spent',
      type: 'rollup',
      rollup: { table: 'lines', via: 'expense', fn: 'sum', column: 'usd' },
    },
    { name: 'rank', type: 'number' },
  ],
}
const names = (columns: { name: string }[]) => columns.map((column) => column.name)

describe('which columns a Form writes (D75)', () => {
  test('unnamed: every stored column, never a formula, a rollup or a board’s rank', () => {
    const plan = formPlan(expenses)
    expect(names(plan.fields)).toEqual(['name', 'amount', 'category', 'date', 'paid', 'tags'])
    expect(plan.refused).toEqual([])
  })

  test('named: in the page’s order; defaults for unshown columns are written too', () => {
    const plan = formPlan(expenses, ['amount', 'name'], { paid: false, amount: 0 })
    expect(names(plan.fields)).toEqual(['amount', 'name'])
    expect(names(plan.written)).toEqual(['amount', 'name', 'paid'])
  })

  test('a computed or unknown field is refused in words — and so is a default over one', () => {
    const plan = formPlan(expenses, ['name', 'month', 'id'], { spent: 3 })
    expect(names(plan.fields)).toEqual(['name'])
    expect(plan.refused).toEqual([
      '“month” is computed from its formula; a form writes its inputs',
      '“id” is not a column of “expenses”',
      '“spent” is computed from the rows it rolls up; a form writes its inputs',
    ])
  })
})

describe('what a Form sends', () => {
  test('a `{ state }` default reads the picker; unset state leaves the column alone', () => {
    const defaults = { date: { state: 'picked' }, paid: false }
    expect(resolveDefaults(defaults, { picked: '2026-11-01' })).toEqual({
      date: '2026-11-01',
      paid: false,
    })
    expect(resolveDefaults(defaults, { picked: '' })).toEqual({ paid: false })
    expect(resolveDefaults(defaults, {})).toEqual({ paid: false })
  })

  test('inputs become the column’s cells; empty ones are left out', () => {
    const { written } = formPlan(expenses)
    expect(
      rowOf(written, { name: ' Lunch ', amount: '12.5', category: '', tags: ['work'], paid: true }),
    ).toEqual({ name: 'Lunch', amount: 12.5, tags: ['work'], paid: true })
    expect(rowOf(written, { amount: 'twelve' })).toEqual({ amount: 'twelve' })
  })

  test('defaults alone never make a row worth adding', () => {
    expect(hasEntries({})).toBe(false)
    expect(hasEntries({ name: '  ', paid: false, tags: [] })).toBe(false)
    expect(hasEntries({ amount: '3' })).toBe(true)
    expect(hasEntries({ paid: true })).toBe(true)
  })
})

describe('the Form primitive', () => {
  const page = (props: string) =>
    validate(
      parse(`<Sheet title="Expenses"><Form table="expenses" ${props} /></Sheet>`),
      paperRegistry,
    )

  test('validates with fields, defaults (literal and state), submit and reset', () => {
    expect(hasErrors(page(''))).toBe(false)
    expect(
      hasErrors(
        page(
          `fields={['name', 'amount', 'category', 'date']} defaults={{ date: { state: 'picked' }, paid: false, tags: ['home'] }} submit="Add expense" reset={false}`,
        ),
      ),
    ).toBe(false)
  })

  test('refuses a field named twice, no fields, a stray prop or a malformed default', () => {
    expect(hasErrors(page(`fields={['name', 'name']}`))).toBe(true)
    expect(hasErrors(page('fields={[]}'))).toBe(true)
    expect(hasErrors(page(`action={{ verb: 'table.insert' }}`))).toBe(true)
    expect(hasErrors(page(`defaults={{ date: { state: 'picked', or: 1 } }}`))).toBe(true)
  })
})
