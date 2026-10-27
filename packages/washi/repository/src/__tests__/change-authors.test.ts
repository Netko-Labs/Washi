import { Database } from 'bun:sqlite'
import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { listRecordChanges } from '../storage/changes'
import { openWorkspace } from '../storage/client'
import { defineTable, insertRecord, updateRecords } from '../storage/tables'

const dirs: string[] = []
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('a version names its author (D78)', () => {
  test('a file from before authors keeps its versions, unsigned, and signs the next', () => {
    const dir = mkdtempSync(join(tmpdir(), 'washi-authors-'))
    dirs.push(dir)
    const path = join(dir, 'old.db')
    const old = new Database(path, { create: true })
    old.exec(`CREATE TABLE record_changes (
      seq INTEGER PRIMARY KEY AUTOINCREMENT, table_id TEXT NOT NULL, record_id TEXT NOT NULL,
      data TEXT, at_ms INTEGER NOT NULL)`)
    old
      .query('INSERT INTO record_changes (table_id, record_id, data, at_ms) VALUES (?, ?, ?, ?)')
      .run('t', 'r1', '{"paid":false}', 1)
    old.close()

    const ws = openWorkspace({ id: 'old', path })
    expect(listRecordChanges(ws, 'r1').map((change) => change.author)).toEqual([null])
    const table = defineTable(ws, { name: 'bills', columns: [{ name: 'paid', type: 'boolean' }] })
    const id = insertRecord(ws, table.id, { paid: false }, 'juan')
    updateRecords(ws, table.id, [id], { paid: true }, 'washi')
    expect(listRecordChanges(ws, id).map((change) => change.author)).toEqual(['juan', 'washi'])
    ws.close()

    const again = openWorkspace({ id: 'old', path })
    expect(listRecordChanges(again, id)).toHaveLength(2)
    again.close()
  })
})
