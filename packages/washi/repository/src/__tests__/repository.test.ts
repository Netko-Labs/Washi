import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  createSheet,
  defineTable,
  deleteRecords,
  deleteSheet,
  executeQuery,
  getBacklinks,
  getSheet,
  insertRecord,
  listSheets,
  matchRecordIds,
  openWorkspace,
  searchSheets,
  updateRecords,
  updateSheet,
  type Workspace,
} from '../index'
import { createSnapshot, readSnapshot, updateSnapshot } from '../storage/loro'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
})
afterEach(() => ws.close())

const write = (source: string, title = 'Test sheet') => ({ title, source })
const index = (body: string, refs: string[] = []) => ({ body, refs })

describe('loro store', () => {
  test('snapshot round-trips and updates preserve history', () => {
    const first = createSnapshot('<Sheet title="a"><P>one</P></Sheet>')
    expect(readSnapshot(first)).toContain('one')
    const second = updateSnapshot(first, '<Sheet title="a"><P>one</P><P>two</P></Sheet>')
    expect(readSnapshot(second)).toContain('two')
  })
})

describe('sheets', () => {
  test('create → list → get → update → delete lifecycle', () => {
    const sheet = createSheet(
      ws,
      write('<Sheet title="t"><P>hello washi</P></Sheet>'),
      index('hello washi'),
    )
    expect(listSheets(ws).map((row) => row.id)).toContain(sheet.id)

    const updated = updateSheet(
      ws,
      sheet.id,
      write('<Sheet title="t"><P>changed</P></Sheet>'),
      index('changed'),
    )
    expect(updated?.source).toContain('changed')

    expect(deleteSheet(ws, sheet.id)).toBe(true)
    expect(getSheet(ws, sheet.id)).toBeNull()
    expect(listSheets(ws)).toHaveLength(0)
  })

  test('fts search + snippet, updated on rewrite', () => {
    const sheet = createSheet(ws, write('...', 'Roadmap'), index('quarterly goblin objectives'))
    expect(searchSheets(ws, 'goblin')[0]?.id).toBe(sheet.id)

    updateSheet(ws, sheet.id, write('...', 'Roadmap'), index('now something else entirely'))
    expect(searchSheets(ws, 'goblin')).toHaveLength(0)
    expect(searchSheets(ws, 'entirely')[0]?.id).toBe(sheet.id)
  })

  test('backlinks come from extracted refs', () => {
    const target = createSheet(ws, write('...', 'Target'), index('target'))
    const linker = createSheet(ws, write('...', 'Linker'), index('linker', [target.id]))
    expect(getBacklinks(ws, target.id).map((row) => row.id)).toEqual([linker.id])
  })

  test('oplog grows with every mutation', () => {
    createSheet(ws, write('...'), index('x'))
    const count = ws.sqlite.query('SELECT COUNT(*) AS n FROM oplog').get() as { n: number }
    expect(count.n).toBeGreaterThan(0)
  })
})

describe('ink executor', () => {
  const spec = {
    name: 'tasks',
    columns: [
      { name: 'title', type: 'text' as const },
      { name: 'done', type: 'boolean' as const },
      { name: 'points', type: 'number' as const },
      { name: 'status', type: 'select' as const, options: ['todo', 'doing', 'shipped'] },
    ],
  }

  const seed = () => {
    const table = defineTable(ws, spec)
    insertRecord(ws, table.id, { title: 'a', done: false, points: 3, status: 'todo' })
    insertRecord(ws, table.id, { title: 'b', done: true, points: 5, status: 'shipped' })
    insertRecord(ws, table.id, { title: 'c', done: false, points: 2, status: 'todo' })
    return table
  }

  test('filters, order, limit, boolean revival', () => {
    const table = seed()
    const result = executeQuery(ws, table.id, spec, {
      table: 'tasks',
      where: [{ column: 'status', op: 'eq', value: 'todo' }],
      orderBy: { column: 'points', direction: 'desc' },
    })
    expect(result.rows.map((row) => row.title)).toEqual(['a', 'c'])
    expect(result.rows[0]?.done).toBe(false)
  })

  test('group-by aggregations: count and sum', () => {
    const table = seed()
    const result = executeQuery(ws, table.id, spec, {
      table: 'tasks',
      groupBy: { column: 'status', aggregates: [{ fn: 'count' }, { fn: 'sum', column: 'points' }] },
    })
    const todo = result.rows.find((row) => row.status === 'todo')
    expect(todo?.count).toBe(2)
    expect(todo?.sum_points).toBe(5)
  })

  test('contains + in filters, update and tombstone delete', () => {
    const table = seed()
    expect(
      executeQuery(ws, table.id, spec, {
        table: 'tasks',
        where: [{ column: 'status', op: 'in', value: ['todo', 'doing'] }],
      }).rows,
    ).toHaveLength(2)

    const ids = matchRecordIds(ws, table.id, spec, [
      { column: 'title', op: 'contains', value: 'a' },
    ])
    expect(updateRecords(ws, table.id, ids, { done: true })).toBe(1)
    expect(
      executeQuery(ws, table.id, spec, {
        table: 'tasks',
        where: [{ column: 'done', op: 'eq', value: true }],
      }).rows,
    ).toHaveLength(2)

    deleteRecords(ws, table.id, ids)
    expect(executeQuery(ws, table.id, spec, { table: 'tasks' }).rows).toHaveLength(2)
  })
})
