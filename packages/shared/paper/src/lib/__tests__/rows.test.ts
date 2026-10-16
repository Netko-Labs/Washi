import { describe, expect, test } from 'bun:test'
import { columnOf } from '../rows'

const PLACES = [
  { id: 'a', name: null, kind: null, cost: null },
  { id: 'b', name: 'Kiyomizu-dera', kind: 'temple', cost: 400 },
]

describe('columnOf', () => {
  test('a null in the first row does not hide the column', () => {
    expect(columnOf(PLACES, 'string')).toBe('name')
    expect(columnOf(PLACES, 'number')).toBe('cost')
  })

  test('a preferred name wins over column order', () => {
    expect(columnOf(PLACES, 'string', ['title', 'kind'])).toBe('kind')
  })

  test('ids never title anything', () => {
    expect(columnOf([{ id: 'a' }], 'string')).toBeUndefined()
  })
})
