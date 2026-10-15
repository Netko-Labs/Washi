import { afterEach, describe, expect, setSystemTime, test } from 'bun:test'
import { listChanges } from '../storage/changes'
import { backfillChanges } from '../storage/changes-backfill'
import { openWorkspace } from '../storage/client'
import { defineTable, insertRecord, updateRecords } from '../storage/tables'

afterEach(() => setSystemTime())

describe('history for rows older than the change log', () => {
  test('replays the oplog: a row moved to Done later was not Done when it was born', () => {
    // The workspace clock never runs backwards, so it starts on the fake day.
    setSystemTime(new Date(Date.UTC(2026, 9, 1)))
    const ws = openWorkspace({ id: 'test', path: ':memory:' })
    const table = defineTable(ws, {
      name: 'issues',
      columns: [{ name: 'state', type: 'text' }],
    })
    const id = insertRecord(ws, table.id, { state: 'Todo' })
    setSystemTime(new Date(Date.UTC(2026, 9, 3)))
    updateRecords(ws, table.id, [id], { state: 'Done' })

    // As a workspace from before the change log: rows, an oplog, no changes.
    ws.sqlite.query('DELETE FROM record_changes').run()
    backfillChanges(ws.sqlite)

    expect(listChanges(ws, table.id).map((change) => [change.data, change.atMs])).toEqual([
      [{ state: 'Todo' }, Date.UTC(2026, 9, 1)],
      [{ state: 'Done' }, Date.UTC(2026, 9, 3)],
    ])
    ws.close()
  })
})
