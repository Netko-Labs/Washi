import { describe, expect, test } from 'bun:test'
import { cellItems, columnOf, listCell, patchRow, toRows } from '../rows'

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

describe('cellItems and patchRow', () => {
  test('a pill per item, a value alone, nothing for an empty cell — kept across a patch', () => {
    const [row] = toRows([{ id: 'a', tags: ['bug', 'infra'], list: 'Doing', due: null }])
    if (!row) throw new Error('no row')
    expect(cellItems(row, 'tags')).toEqual(['bug', 'infra'])
    expect(cellItems(row, 'list')).toEqual(['Doing'])
    expect(cellItems(row, 'due')).toEqual([])
    const moved = patchRow(row, { list: 'Done' })
    expect(moved.list).toBe('Done')
    expect(cellItems(moved, 'tags')).toEqual(['bug', 'infra'])
    expect(cellItems(patchRow(row, { tags: 'bug' }), 'tags')).toEqual(['bug'])
  })

  test('an item held twice pills once', () => {
    const [row] = toRows([{ id: 'a', tags: ['bug', 'bug', 'infra'] }])
    expect(row && cellItems(row, 'tags')).toEqual(['bug', 'infra'])
  })

  test('an empty list holds nothing to pill', () => {
    const [row] = toRows([{ id: 'a', tags: [] }])
    expect(row && cellItems(row, 'tags')).toEqual([])
    expect(cellItems({ note: '' }, 'note')).toEqual([])
  })
})
