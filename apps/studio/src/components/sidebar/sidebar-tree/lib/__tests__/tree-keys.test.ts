import { describe, expect, test } from 'bun:test'
import type { SheetSummary } from '@washi/domain'
import { tabStopOf, treeMove, visibleRows } from '../utils'

const page = (id: string) => ({ id }) as SheetSummary
const groups = new Map<string | null, SheetSummary[]>([
  [null, [page('a'), page('b')]],
  ['a', [page('a1'), page('a2')]],
])

describe('the tree as drawn', () => {
  test('a closed parent hides its children', () => {
    expect(visibleRows(groups, []).map((row) => row.id)).toEqual(['a', 'b'])
  })

  test('an open parent draws them under it', () => {
    expect(visibleRows(groups, ['a']).map((row) => row.id)).toEqual(['a', 'a1', 'a2', 'b'])
  })
})

describe('one row is Tab’s', () => {
  const rows = visibleRows(groups, [])

  test('the last focused, while drawn', () => {
    expect(tabStopOf(rows, 'b', 'a')).toBe('b')
  })

  test('else the open page, else the first', () => {
    expect(tabStopOf(rows, 'a1', 'b')).toBe('b')
    expect(tabStopOf(rows, null, 'a2')).toBe('a')
    expect(tabStopOf([], null, null)).toBeNull()
  })
})

describe('arrow keys', () => {
  const closed = visibleRows(groups, [])
  const open = visibleRows(groups, ['a'])

  test('up and down walk the drawn rows and stop at the ends', () => {
    expect(treeMove(open, 'a', 'ArrowDown')).toEqual({ kind: 'focus', id: 'a1' })
    expect(treeMove(open, 'b', 'ArrowUp')).toEqual({ kind: 'focus', id: 'a2' })
    expect(treeMove(open, 'b', 'ArrowDown')).toBeNull()
    expect(treeMove(open, 'a2', 'Home')).toEqual({ kind: 'focus', id: 'a' })
    expect(treeMove(open, 'a', 'End')).toEqual({ kind: 'focus', id: 'b' })
  })

  test('right opens a parent, then enters it', () => {
    expect(treeMove(closed, 'a', 'ArrowRight')).toEqual({ kind: 'toggle', id: 'a' })
    expect(treeMove(open, 'a', 'ArrowRight')).toEqual({ kind: 'focus', id: 'a1' })
    expect(treeMove(open, 'b', 'ArrowRight')).toBeNull()
  })

  test('left closes a parent, else climbs to it', () => {
    expect(treeMove(open, 'a', 'ArrowLeft')).toEqual({ kind: 'toggle', id: 'a' })
    expect(treeMove(open, 'a2', 'ArrowLeft')).toEqual({ kind: 'focus', id: 'a' })
    expect(treeMove(closed, 'b', 'ArrowLeft')).toBeNull()
  })

  test('other keys are the browser’s', () => {
    expect(treeMove(open, 'a', 'Enter')).toBeNull()
  })
})
