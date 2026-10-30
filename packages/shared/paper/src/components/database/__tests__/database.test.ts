import { describe, expect, test } from 'bun:test'
import type { PaperHost } from '../../../provider'
import type { TableSpec } from '../lib'
import { dateLabel, namedColumns, relationChoices } from '../lib'

const projects: TableSpec = {
  name: 'projects',
  columns: [
    { name: 'name', type: 'text' },
    { name: 'stage', type: 'select', options: ['Lead'] },
    { name: 'value', type: 'number' },
  ],
}

const hostOf = (spec: TableSpec | null, fails = false) =>
  ({
    describeTable: async () => spec,
    runQuery: async () => {
      if (fails) throw new Error('no table called "projects"')
      return {
        rows: [
          { id: 'p1', name: 'Atlas' },
          { id: 'p2', name: '' },
        ],
      }
    },
  }) as unknown as PaperHost

describe('a view’s columns', () => {
  test('come in the order the page wrote them; a name the table lacks is skipped', () => {
    const names = namedColumns(projects, ['value', 'gone', 'name'])
    expect(names.map((column) => column.name)).toEqual(['value', 'name'])
  })
})

describe('a relation’s rows', () => {
  test('are named by their titles, an untitled one as Untitled', async () => {
    expect(await relationChoices(hostOf(projects), 'projects')).toEqual([
      { value: 'p1', label: 'Atlas' },
      { value: 'p2', label: 'Untitled' },
    ])
  })

  test('are none to name when the table is gone or will not answer', async () => {
    expect(await relationChoices(hostOf(null), 'projects')).toBeNull()
    expect(await relationChoices(hostOf(projects, true), 'projects')).toBeNull()
  })
})

describe('a date’s label', () => {
  test('writes every year in four digits, a range too', () => {
    expect(dateLabel('2026-11-04', '', 'en-US')).toBe('Nov 4, 2026')
    expect(dateLabel('0001-01-01', '', 'en-US')).toBe('Jan 1, 0001')
    expect(dateLabel('0999-03-01', '0999-03-04', 'en-US')).toBe('Mar 1 – 4, 0999')
  })
})
