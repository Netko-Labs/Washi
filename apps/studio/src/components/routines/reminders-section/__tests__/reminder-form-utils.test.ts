import { describe, expect, test } from 'bun:test'
import { inputOf } from '../lib/utils'

describe('the add form becomes a rule', () => {
  test('only unpaid is a checkbox filter; no name falls back to the table', () => {
    const draft = {
      title: ' ',
      table: 'bills',
      dateColumn: 'due',
      daysBefore: 3,
      only: 'paid:false',
    }
    expect(inputOf(draft, 'UTC')).toEqual({
      title: 'bills due',
      table: 'bills',
      dateColumn: 'due',
      daysBefore: 3,
      where: [{ column: 'paid', op: 'eq', value: false }],
      timeZone: 'UTC',
    })
    expect(inputOf({ ...draft, only: '' }, 'UTC').where).toEqual([])
  })
})
