import type { RecordData } from '@washi/ink'
import type { Workspace } from './client'

export interface RecordChange {
  recordId: string
  /** The whole row after the change; null when the row was deleted. */
  data: RecordData | null
  atMs: number
  /** A member id, `washi`, or null: a change from before authors were kept (D78). */
  author: string | null
}

interface ChangeRow {
  record_id: string
  data: string | null
  at_ms: number
  author: string | null
}

const toChange = (row: ChangeRow): RecordChange => ({
  recordId: row.record_id,
  data: row.data === null ? null : (JSON.parse(row.data) as RecordData),
  atMs: row.at_ms,
  author: row.author,
})

/** Append-only: every write to a row leaves what the row became, so a chart can replay any day. */
export function appendChange(
  ws: Workspace,
  tableId: string,
  recordId: string,
  data: RecordData | null,
  author: string | null,
): void {
  ws.sqlite
    .query(
      'INSERT INTO record_changes (table_id, record_id, data, at_ms, author) VALUES (?, ?, ?, ?, ?)',
    )
    .run(tableId, recordId, data === null ? null : JSON.stringify(data), Date.now(), author)
}

export function listChanges(ws: Workspace, tableId: string): RecordChange[] {
  return (
    ws.sqlite
      .query(
        'SELECT record_id, data, at_ms, author FROM record_changes WHERE table_id = ? ORDER BY at_ms, seq',
      )
      .all(tableId) as ChangeRow[]
  ).map(toChange)
}

/** One row's every version, oldest first. */
export function listRecordChanges(ws: Workspace, recordId: string): RecordChange[] {
  return (
    ws.sqlite
      .query(
        'SELECT record_id, data, at_ms, author FROM record_changes WHERE record_id = ? ORDER BY at_ms, seq',
      )
      .all(recordId) as ChangeRow[]
  ).map(toChange)
}
