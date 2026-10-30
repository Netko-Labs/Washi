import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { listRecordChanges, listTables, openWorkspace, type Workspace } from '@washi/repository'
import { CHANGE_TOOLS } from '../agents/lib'
import { tableCapabilities } from '../capabilities'
import { NOBODY } from '../sheets/access'
import { createSheetFromSource } from '../sheets/service'
import { restoreUserTable, trashedTables } from '../tables/catalog'
import { InkError } from '../tables/errors'
import { defineUserTable, runMutation, runQuery } from '../tables/service'
import { guardWashiTableTrash } from '../tables/washi-trash'

let ws: Workspace
let row: string
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  defineUserTable(ws, {
    name: 'issues',
    columns: [
      { name: 'title', type: 'text' },
      { name: 'done', type: 'boolean' },
    ],
  })
  defineUserTable(ws, { name: 'scratch', columns: [{ name: 'note', type: 'text' }] })
  row = runMutation(ws, { kind: 'insert', table: 'issues', data: { title: 'Ship' } }).id ?? ''
})
afterEach(() => ws.close())

const RIN = { id: 'rin', isOwner: false }

const page = (title: string, body: string, props = '') =>
  createSheetFromSource(ws, { title, source: `<Sheet title="${title}"${props}>${body}</Sheet>` })

const trashAs = (
  viewer: { id: string | null; isOwner: boolean },
  table: string,
  author = 'washi',
) => {
  const tool = tableCapabilities(ws, { viewer, author }).find(
    (each) => each.name === 'db_trash_table',
  )
  if (!tool) throw new Error('no db_trash_table')
  return tool.run({ table })
}

const live = () => listTables(ws).map((table) => table.name)

describe('Washi trashes a table when asked (D121)', () => {
  test('a write that lands without asking, never a purge', () => {
    expect(CHANGE_TOOLS.has('db_trash_table')).toBe(true)
    const names = tableCapabilities(ws, { viewer: RIN, author: 'washi' }).map((each) => each.name)
    expect(names.some((name) => name.includes('purge'))).toBe(false)
  })

  test('the table goes to the Trash; rows and history wait; it names the pages gone quiet', async () => {
    page('Backlog', `<Database table="issues" />`)
    const history = listRecordChanges(ws, row).length
    expect(await trashAs(RIN, 'issues')).toMatchObject({
      name: 'issues',
      rows: 1,
      shownOn: ['Backlog'],
    })
    expect(live()).toEqual(['scratch'])
    expect(trashedTables(ws)).toMatchObject([{ name: 'issues', rows: 1 }])
    expect(listRecordChanges(ws, row)).toHaveLength(history)
  })

  test('restore brings it back with its rows as they were', async () => {
    const { id } = (await trashAs(RIN, 'issues')) as { id: string }
    restoreUserTable(ws, id)
    expect(runQuery(ws, { table: 'issues' }).rows).toMatchObject([{ id: row, title: 'Ship' }])
    expect(trashedTables(ws)).toEqual([])
  })

  test('a routine trashes nothing', async () => {
    await expect(trashAs(NOBODY, 'scratch')).rejects.toThrow(/routine/)
    expect(live()).toContain('scratch')
  })

  test('a table on a public page stays until a person takes it', async () => {
    page('Roadmap', `<Database table="issues" />`, ' visibility="public"')
    await expect(trashAs(RIN, 'issues')).rejects.toThrow(/“Roadmap”, on a public link/)
    expect(live()).toContain('issues')
  })

  test('a table another table reads stays, its dependants named', async () => {
    defineUserTable(ws, {
      name: 'projects',
      columns: [
        { name: 'name', type: 'text' },
        {
          name: 'open',
          type: 'rollup',
          rollup: { table: 'issues', via: 'title', on: 'name', fn: 'count' },
        },
      ],
    })
    defineUserTable(ws, {
      name: 'links',
      columns: [{ name: 'issue', type: 'relation', table: 'issues' }],
    })
    const refused = await trashAs(RIN, 'issues').catch((error: Error) => error.message)
    expect(refused).toContain('“projects”')
    expect(refused).toContain('“links”')
    expect(refused).toContain('still read “issues” through a relation or rollup')
    expect(live()).toContain('issues')
  })

  test('an unknown table is said so', async () => {
    await expect(trashAs(RIN, 'nope')).rejects.toBeInstanceOf(InkError)
  })

  test('an outside agent trashes as its member does, through the same capability', async () => {
    page('Roadmap', `<Database table="issues" />`, ' visibility="public"')
    await trashAs(RIN, 'issues', 'rin')
    expect(live()).toEqual(['scratch'])
  })
})

describe('guardWashiTableTrash', () => {
  test('lets a person’s plain ask through', () => {
    page('Notes', `<Database table="scratch" />`)
    expect(() => guardWashiTableTrash(ws, 'scratch', RIN)).not.toThrow()
  })

  test('refuses in words: routine, public page, dependants', () => {
    expect(() => guardWashiTableTrash(ws, 'scratch', NOBODY)).toThrow(InkError)
    page('Live', `<Database table="scratch" />`, ' visibility="public"')
    expect(() => guardWashiTableTrash(ws, 'scratch', RIN)).toThrow(/“Live”/)
    defineUserTable(ws, {
      name: 'tags',
      columns: [{ name: 'issue', type: 'relation', table: 'issues' }],
    })
    expect(() => guardWashiTableTrash(ws, 'issues', RIN)).toThrow(/“tags” still read “issues”/)
  })
})
