import { describe, expect, test } from 'bun:test'
import { hasErrors, parse, validate } from '@washi/wsx'
import { paperRegistry } from '../../registry'
import { resolveActionParams, resolveFilters, resolveQuery } from '../bind'

describe('a filter that reads page state (D72)', () => {
  const where = [
    { column: 'month', op: 'eq' as const, value: { state: 'picked_month' } },
    { column: 'paid', op: 'eq' as const, value: false },
  ]

  test('takes the picked value; literals pass untouched', () => {
    expect(resolveFilters(where, { picked_month: '2026-11' })).toEqual([
      { column: 'month', op: 'eq', value: '2026-11' },
      { column: 'paid', op: 'eq', value: false },
    ])
  })

  test('unset, empty or null state drops the filter — "All months"', () => {
    const cleared: Record<string, string | null>[] = [
      {},
      { picked_month: '' },
      { picked_month: null },
    ]
    for (const values of cleared) {
      expect(resolveFilters(where, values)).toEqual([{ column: 'paid', op: 'eq', value: false }])
    }
    expect(resolveQuery({ table: 'expenses' }, {})).toEqual({
      table: 'expenses',
      where: undefined,
      params: undefined,
    })
  })

  test('params read state for rollups; unset ones are left out', () => {
    const query = { table: 'categories', params: { month: { state: 'picked_month' }, cap: 3 } }
    expect(resolveQuery(query, { picked_month: '2026-11' }).params).toEqual({
      month: '2026-11',
      cap: 3,
    })
    expect(resolveQuery(query, {}).params).toEqual({ cap: 3 })
  })

  test('a page with a Select driving its views validates; a malformed reference does not', () => {
    const page = (value: string) =>
      validate(
        parse(
          `<Sheet title="Budget" state={{ local: { picked_month: '2026-10' } }}><Select state="picked_month" options={['2026-10', { value: '2026-11', label: 'November' }]} all="All months" /><Table bind={{ table: 'expenses', where: [{ column: 'month', op: 'eq', value: ${value} }] }} /></Sheet>`,
        ),
        paperRegistry,
      )
    expect(hasErrors(page(`{ state: 'picked_month' }`))).toBe(false)
    expect(hasErrors(page(`{ state: 'picked_month', fallback: 1 }`))).toBe(true)
  })
})

describe('a copy Button that reads page state (D76)', () => {
  const rollover = {
    verb: 'table.copy',
    table: 'expenses',
    params: { month: { state: 'picked_month' }, note: 'rolled' },
    where: [
      { column: 'recurring', op: 'eq', value: true },
      { column: 'next_month', op: 'eq', value: { param: 'month' } },
    ],
    set: { date: { expr: 'next_date' }, paid: false },
  }

  test('params take the picked value before the action leaves; unset ones are left out', () => {
    expect(resolveActionParams(rollover, { picked_month: '2026-11' })).toEqual({
      ...rollover,
      params: { month: '2026-11', note: 'rolled' },
    })
    expect(resolveActionParams(rollover, {}).params).toEqual({ note: 'rolled' })
    const insert = { verb: 'table.insert', table: 'expenses', data: { name: 'x' } }
    expect(resolveActionParams(insert, {})).toBe(insert)
  })

  test('the page carrying it validates', () => {
    const action = JSON.stringify(rollover).replace(/"(\w+)":/g, '$1:')
    const page = parse(
      `<Sheet title="Budget" state={{ local: { picked_month: '2026-11' } }}><Button action={${action}}>Roll recurring into this month</Button></Sheet>`,
    )
    expect(hasErrors(validate(page, paperRegistry))).toBe(false)
  })
})
