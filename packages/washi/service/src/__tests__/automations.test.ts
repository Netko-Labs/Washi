import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { deleteSheet, listCapabilityCalls, openWorkspace, type Workspace } from '@washi/repository'
import { watchAutomations } from '../scripts/automations'
import { createSheetFromSource } from '../sheets/service'
import { defineUserTable, runMutation, runQuery } from '../tables/service'

let ws: Workspace
let stop: () => void
let changed: number
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  defineUserTable(ws, {
    name: 'tasks',
    columns: [
      { name: 'title', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'edits', type: 'number' },
    ],
  })
  defineUserTable(ws, { name: 'log', columns: [{ name: 'note', type: 'text' }] })
  changed = 0
  stop = watchAutomations(ws, () => {
    changed += 1
  })
})
afterEach(() => {
  stop()
  ws.close()
})

const page = (on: string, code: string) =>
  createSheetFromSource(ws, {
    title: 'Rules',
    source: `<Sheet title="Rules"><Automation table="tasks" on="${on}" title="rule">{\`${code}\`}</Automation></Sheet>`,
  })

/** Automations run after the write, on the next tick and after QuickJS loads. */
async function settled() {
  for (let i = 0; i < 40; i++) await Bun.sleep(10)
}

const tasks = () => runQuery(ws, { table: 'tasks' }).rows

describe('automations', () => {
  test('a new row is filled in by the automation listening on its table, and it is ledgered', async () => {
    page(
      'insert',
      "function run(event) { if (!event.row.status) act({ verb: 'table.update', table: 'tasks', row: event.row.id, set: { status: 'todo' } }) }",
    )
    runMutation(ws, { kind: 'insert', table: 'tasks', data: { title: 'Write' } }, 'p1')
    await settled()
    expect(tasks()[0]).toMatchObject({ title: 'Write', status: 'todo' })
    expect(changed).toBe(1)
    expect(listCapabilityCalls(ws)[0]).toMatchObject({ subject: 'automation', decision: 'auto' })
  })

  test('what an automation writes never runs automations — an update rule runs once, not forever', async () => {
    page(
      'update',
      "function run(event) { act({ verb: 'table.update', table: 'tasks', row: event.row.id, set: { edits: (event.row.edits ?? 0) + 1 } }) }",
    )
    const { id = '' } = runMutation(
      ws,
      { kind: 'insert', table: 'tasks', data: { title: 'A', edits: 0 } },
      'p1',
    )
    runMutation(
      ws,
      {
        kind: 'update',
        table: 'tasks',
        where: [{ column: 'id', op: 'eq', value: id }],
        data: { title: 'B' },
      },
      'p1',
    )
    await settled()
    expect(tasks()[0]).toMatchObject({ title: 'B', edits: 1 })
  })

  test('it reads rows as they are now and may write to another table', async () => {
    page(
      'insert',
      "function run() { act({ verb: 'table.insert', table: 'log', data: { note: 'tasks: ' + rows({ table: 'tasks' }).length } }) }",
    )
    runMutation(ws, { kind: 'insert', table: 'tasks', data: { title: 'One' } }, 'p1')
    await settled()
    expect(runQuery(ws, { table: 'log' }).rows.map((row) => row.note)).toEqual(['tasks: 1'])
  })

  test('a trashed page’s automation sleeps', async () => {
    const sheet = page(
      'insert',
      "function run(event) { act({ verb: 'table.update', table: 'tasks', row: event.row.id, set: { status: 'todo' } }) }",
    )
    deleteSheet(ws, sheet.id)
    runMutation(ws, { kind: 'insert', table: 'tasks', data: { title: 'Quiet' } }, 'p1')
    await settled()
    expect(tasks()[0]?.status ?? null).toBeNull()
  })

  test('a runaway is stopped, nothing it asked for lands, and the ledger says why', async () => {
    page(
      'insert',
      "function run(event) { act({ verb: 'table.delete', table: 'tasks', row: event.row.id }); while (true) {} }",
    )
    runMutation(ws, { kind: 'insert', table: 'tasks', data: { title: 'Kept' } }, 'p1')
    await settled()
    expect(tasks()).toHaveLength(1)
    expect(listCapabilityCalls(ws)[0]).toMatchObject({
      decision: 'denied',
      detail: 'ran past 100 ms',
    })
  })

  test('only rows: a verb that reaches past the table is refused', async () => {
    page('insert', "function run() { act({ verb: 'url.open', url: 'https://example.com' }) }")
    runMutation(ws, { kind: 'insert', table: 'tasks', data: { title: 'X' } }, 'p1')
    await settled()
    expect(listCapabilityCalls(ws)[0]?.detail).toContain('not url.open')
  })
})
