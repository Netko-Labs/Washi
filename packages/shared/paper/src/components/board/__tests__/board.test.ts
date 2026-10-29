import { describe, expect, test } from 'bun:test'
import { boardColumns, headCount, naturalBefore, rankBetween, rankPatches } from '../lib/utils'

const rows = [
  { id: 'a', status: 'todo', rank: 1 },
  { id: 'b', status: 'todo', rank: 2 },
  { id: 'c', status: 'done', rank: 1 },
]
const names = (columns: ReturnType<typeof boardColumns>) =>
  columns.map((column) => `${column.name}:${column.items.map((row) => row.id).join('')}`)

describe('a dropped card holds its place until the server agrees', () => {
  test('while the write is on its way, and through the render it settled in', () => {
    const moving = { a: { group: 'done', rank: 2, against: null } }
    expect(names(boardColumns(rows, moving, 'status', 'rank', ['todo', 'done']))).toEqual([
      'todo:b',
      'done:ca',
    ])
    const settled = { a: { group: 'done', rank: 2, against: rows } }
    expect(names(boardColumns(rows, settled, 'status', 'rank', ['todo', 'done']))).toEqual([
      'todo:b',
      'done:ca',
    ])
  })

  test('the rows fetched after it win, so a move made elsewhere is never masked', () => {
    const settled = { a: { group: 'done', rank: 2, against: rows } }
    const refetched = rows.map((row) => ({ ...row }))
    expect(names(boardColumns(refetched, settled, 'status', 'rank', ['todo', 'done']))).toEqual([
      'todo:ab',
      'done:c',
    ])
  })

  test('a rank lands between its neighbours', () => {
    expect(rankBetween(rows.slice(0, 2), 'b', 'rank')).toBe(1.5)
    expect(rankBetween(rows.slice(0, 2), null, 'rank')).toBe(3)
    expect(rankBetween([], null, 'rank')).toBe(1)
  })
})

describe('where a drop writes', () => {
  test('one rank when the neighbours leave room', () => {
    const order = [
      { id: 'a', rank: 1 },
      { id: 'c', rank: 9 },
      { id: 'b', rank: 2 },
    ]
    expect(rankPatches(order, 'c', 'rank')).toEqual([{ id: 'c', rank: 1.5 }])
  })

  test('the column renumbered when the neighbours tie, so the card lands where it was dropped', () => {
    const order = [
      { id: 'a', rank: 0 },
      { id: 'c', rank: 0 },
      { id: 'b', rank: 0 },
    ]
    expect(rankPatches(order, 'c', 'rank')).toEqual([
      { id: 'a', rank: 1 },
      { id: 'c', rank: 2 },
      { id: 'b', rank: 3 },
    ])
  })

  test('an unordered board shows the card where the rows will put it', () => {
    const all = [{ id: 'a' }, { id: 'c' }, { id: 'b' }]
    expect(naturalBefore(all, [{ id: 'a' }, { id: 'b' }], 'c')).toBe('b')
    expect(naturalBefore(all, [{ id: 'a' }], 'c')).toBeNull()
  })
})

describe('a column head', () => {
  test('counts, and sums a numeric meta in the reader’s numbers — no unit it cannot know', () => {
    const rows = [{ value: 48000 }, { value: 125000 }]
    const plain = (total: number) => total.toLocaleString('en-US')
    expect(headCount(rows, 'value', plain)).toBe('2 · 173,000')
    expect(headCount(rows, undefined, plain)).toBe('2')
    const money = (total: number) => `$${total.toLocaleString('en-US')}`
    expect(headCount(rows, 'value', money)).toBe('2 · $173,000')
  })
})

describe('columns no page named', () => {
  test('follow the column’s own order, empty steps included; an off-list value comes last', () => {
    const cards = [
      { id: 'a', status: 'In review', rank: 1 },
      { id: 'b', status: 'Done', rank: 1 },
      { id: 'c', status: 'Archived', rank: 1 },
    ]
    const steps = ['Backlog', 'In progress', 'In review', 'Done']
    expect(names(boardColumns(cards, {}, 'status', 'rank', undefined, steps))).toEqual([
      'Backlog:',
      'In progress:',
      'In review:a',
      'Done:b',
      'Archived:c',
    ])
    expect(names(boardColumns(cards, {}, 'status', 'rank', undefined))).toEqual([
      'In review:a',
      'Done:b',
      'Archived:c',
    ])
  })
})
