import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  deleteSheet,
  listRecordChanges,
  listTables,
  openWorkspace,
  type Workspace,
} from '@washi/repository'
import { reindexPages } from '../sheets/reindex'
import { createSheetFromSource } from '../sheets/service'
import {
  purgeUserTable,
  restoreUserTable,
  tableCatalog,
  tablesWithPages,
  trashedTables,
  trashUserTable,
} from '../tables/catalog'
import { InkError } from '../tables/errors'
import { defineUserTable, runMutation, runQuery } from '../tables/service'

let ws: Workspace
let tasks: string
let row: string
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  tasks = defineUserTable(ws, {
    name: 'tasks',
    columns: [
      { name: 'title', type: 'text' },
      { name: 'done', type: 'boolean' },
    ],
  }).id
  defineUserTable(ws, { name: 'scratch', columns: [{ name: 'note', type: 'text' }] })
  row = runMutation(ws, { kind: 'insert', table: 'tasks', data: { title: 'Ship' } }).id ?? ''
})
afterEach(() => ws.close())

const RIN = { id: 'rin', isOwner: false }
const KENJI = { id: 'kenji', isOwner: false }

const page = (title: string, body: string, props = '') =>
  createSheetFromSource(ws, { title, source: `<Sheet title="${title}"${props}>${body}</Sheet>` })

const entry = (name: string, viewer = RIN) =>
  tableCatalog(ws, viewer).find((each) => each.name === name)

describe('the databases catalog (D109)', () => {
  test('a table knows the pages that show it; one no page shows has none', () => {
    const board = page('Board', `<Database table="tasks" />`)
    page('Stats', `<Stat label="Open" expr="count(tasks where not done)" />`)
    expect(entry('tasks')).toMatchObject({ rows: 1, columns: 2 })
    expect(entry('tasks')?.pages.map((each) => each.title)).toEqual(['Board', 'Stats'])
    expect(entry('scratch')?.pages).toEqual([])
    deleteSheet(ws, board.id)
    expect(entry('tasks')?.pages.map((each) => each.title)).toEqual(['Stats'])
    expect(tablesWithPages(ws, RIN).find((each) => each.name === 'scratch')?.shownOn).toEqual([])
  })

  test('a private page shows its table only to who reads it', () => {
    page('Mine', `<Database table="tasks" />`, ' visibility="private" access={["rin"]}')
    expect(entry('tasks', RIN)?.pages).toHaveLength(1)
    expect(entry('tasks', KENJI)?.pages).toEqual([])
  })

  test('pages written before the index are read once at open', () => {
    page('Board', `<Table bind={{ table: 'tasks' }} />`)
    ws.sqlite.exec('DELETE FROM sheet_tables')
    ws.sqlite.exec("DELETE FROM app_meta WHERE key = 'index_tables'")
    expect(entry('tasks')?.pages).toEqual([])
    reindexPages(ws)
    expect(entry('tasks')?.pages.map((each) => each.title)).toEqual(['Board'])
  })
})

describe('a table in the Trash', () => {
  test('is gone for queries and the catalog, and leaves its rows untouched', () => {
    const history = listRecordChanges(ws, row).length
    trashUserTable(ws, tasks)
    expect(listTables(ws).map((table) => table.name)).toEqual(['scratch'])
    expect(() => runQuery(ws, { table: 'tasks' })).toThrow(InkError)
    expect(trashedTables(ws)).toMatchObject([{ id: tasks, name: 'tasks', rows: 1 }])
    expect(listRecordChanges(ws, row)).toHaveLength(history)
  })

  test('keeps its name: a new table may not take it', () => {
    trashUserTable(ws, tasks)
    expect(() =>
      defineUserTable(ws, { name: 'tasks', columns: [{ name: 'title', type: 'text' }] }),
    ).toThrow(/in the Trash/)
  })

  test('restores with its rows as they were', () => {
    trashUserTable(ws, tasks)
    restoreUserTable(ws, tasks)
    expect(runQuery(ws, { table: 'tasks' }).rows).toMatchObject([{ id: row, title: 'Ship' }])
    expect(trashedTables(ws)).toEqual([])
  })

  test('purges for good: rows, history, the name free again', () => {
    expect(() => purgeUserTable(ws, tasks)).toThrow(InkError)
    trashUserTable(ws, tasks)
    purgeUserTable(ws, tasks)
    expect(trashedTables(ws)).toEqual([])
    expect(listRecordChanges(ws, row)).toEqual([])
    expect(ws.sqlite.query('SELECT COUNT(*) AS n FROM records').get()).toEqual({ n: 0 })
    defineUserTable(ws, { name: 'tasks', columns: [{ name: 'title', type: 'text' }] })
    expect(runQuery(ws, { table: 'tasks' }).rows).toEqual([])
  })
})
