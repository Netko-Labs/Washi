import { describe, expect, test } from 'bun:test'
import type { TrashEntry, TrashedTable } from '@washi/domain'
import { trashItems } from '../utils'

const stamp = (ms: number) => `${ms.toString().padStart(14, '0')}-0000-dev`
const page = (title: string, ms: number): TrashEntry => ({
  id: title,
  title,
  icon: null,
  deletedAt: stamp(ms),
  nestedCount: 0,
})
const table = (name: string, ms: number): TrashedTable => ({
  id: name,
  name,
  rows: 0,
  deletedAt: stamp(ms),
})
const names = (items: ReturnType<typeof trashItems>) =>
  items.map((item) => (item.kind === 'page' ? item.entry.title : item.table.name))

describe('trashItems', () => {
  test('pages and databases interleave by their stamp, newest first', () => {
    const items = trashItems(
      [page('Roadmap', 300), page('Wiki', 100)],
      [table('issues', 200), table('projects', 400)],
      '',
    )
    expect(names(items)).toEqual(['projects', 'Roadmap', 'issues', 'Wiki'])
  })

  test('the search reads page titles and database names alike', () => {
    const items = trashItems([page('Roadmap', 300)], [table('road_trips', 200)], ' ROAD ')
    expect(names(items)).toEqual(['Roadmap', 'road_trips'])
    expect(trashItems([page('Wiki', 1)], [table('issues', 2)], 'zzz')).toEqual([])
  })
})
