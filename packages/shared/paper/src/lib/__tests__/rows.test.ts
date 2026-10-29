import { describe, expect, test } from 'bun:test'
import { columnOf, listCell, toRows } from '../rows'

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

describe('toRows', () => {
  test('a list reads joined, and its items stay whole for a view that pills them', () => {
    const [row] = toRows([{ id: 'a', tags: ['urgent', 'Smith, Jones'], name: 'Fix login' }])
    expect(row?.tags).toBe('urgent, Smith, Jones')
    expect(row && listCell(row, 'tags')).toEqual(['urgent', 'Smith, Jones'])
    expect(row && listCell(row, 'name')).toBeUndefined()
  })
})
