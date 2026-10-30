import { describe, expect, test } from 'bun:test'
import type { ColumnSpec, QueryRow } from '../lib'
import { optionGroups, optionRemovalWords, renamedHidden, renamedSort, sortRows } from '../lib'

describe('a renamed property', () => {
  test('keeps the reader’s sort and hide under its new name, and leaves others be', () => {
    expect(renamedSort({ column: 'qty', direction: 'desc' }, 'qty', 'count')).toEqual({
      column: 'count',
      direction: 'desc',
    })
    expect(renamedSort({ column: 'name', direction: 'asc' }, 'qty', 'count')?.column).toBe('name')
    expect(renamedSort(null, 'qty', 'count')).toBeNull()
    expect(renamedHidden(['qty', 'stage'], 'qty', 'count')).toEqual(['count', 'stage'])
  })
})

const rows: QueryRow[] = [
  { id: 'a', name: 'Atlas', qty: 10, stage: 'Won', owner: 'u2' },
  { id: 'b', name: 'borealis', qty: null, stage: 'Lead', owner: 'u1' },
  { id: 'c', name: 'Cirrus', qty: 2, stage: null },
  { id: 'd', name: 'Atlas 2', qty: 10, stage: 'Lead' },
]
const people = [
  { id: 'u1', name: 'Zoe' },
  { id: 'u2', name: 'Ana' },
]
const ids = (sorted: QueryRow[]) => sorted.map((row) => row.id)
const number: ColumnSpec = { name: 'qty', type: 'number' }
const stage: ColumnSpec = { name: 'stage', type: 'select', options: ['Lead', 'Won'] }

describe('a reader’s sort', () => {
  test('orders numbers by value, ties kept as loaded, empties last either way', () => {
    expect(ids(sortRows(rows, number, 'asc', people))).toEqual(['c', 'a', 'd', 'b'])
    expect(ids(sortRows(rows, number, 'desc', people))).toEqual(['a', 'd', 'c', 'b'])
  })

  test('orders a choice by its place in the column, a person by name, text as people read it', () => {
    expect(ids(sortRows(rows, stage, 'asc', people))).toEqual(['b', 'd', 'a', 'c'])
    expect(ids(sortRows(rows, { name: 'owner', type: 'person' }, 'asc', people))).toEqual([
      'a',
      'b',
      'c',
      'd',
    ])
    expect(ids(sortRows(rows, { name: 'name', type: 'text' }, 'asc', people))).toEqual([
      'a',
      'd',
      'b',
      'c',
    ])
  })

  test('never moves the rows it was given', () => {
    sortRows(rows, number, 'desc', people)
    expect(ids(rows)).toEqual(['a', 'b', 'c', 'd'])
  })
})

describe('a property’s options', () => {
  test('a select is one list; a status lists its three groups', () => {
    expect(optionGroups(stage)).toEqual([{ label: null, options: ['Lead', 'Won'] }])
    const status: ColumnSpec = {
      name: 'state',
      type: 'status',
      groups: { todo: ['Not started'], doing: [], done: ['Done'] },
    }
    expect(optionGroups(status).map((group) => [group.label, group.options])).toEqual([
      ['To-do', ['Not started']],
      ['In progress', []],
      ['Complete', ['Done']],
    ])
  })

  test('an option in use warns with how many rows hold it', () => {
    expect(optionRemovalWords({ option: 'Blocked', count: 3 })).toBe(
      '3 rows hold “Blocked” — removing it leaves them empty.',
    )
    expect(optionRemovalWords({ option: 'Blocked', count: 1 })).toBe(
      '1 row holds “Blocked” — removing it leaves it empty.',
    )
    expect(optionRemovalWords({ option: 'Blocked', count: 1000 })).toStartWith('At least 1000')
    expect(optionRemovalWords({ option: 'Blocked', count: null })).toBe(
      'Rows that hold “Blocked” will be left empty.',
    )
  })
})
