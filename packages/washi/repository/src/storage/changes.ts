import type { RecordData } from '@washi/ink'
import type { Workspace } from './client'

export interface RecordChange {
  recordId: string
  /** The whole row after the change; null when the row was deleted. */
  data: RecordData | null
  atMs: number
}

/** Append-only: every write to a row leaves what the row became, so a chart can replay any day. */
export function appendChange(
  ws: Workspace,
  tableId: string,
  recordId: string,
  data: RecordData | null,
): void {
  ws.sqlite
    .query('INSERT INTO record_changes (table_id, record_id, data, at_ms) VALUES (?, ?, ?, ?)')
    .run(tableId, recordId, data === null ? null : JSON.stringify(data), Date.now())
}

export function listChanges(ws: Workspace, tableId: string): RecordChange[] {
  return (
    ws.sqlite
      .query(
        'SELECT record_id, data, at_ms FROM record_changes WHERE table_id = ? ORDER BY at_ms, seq',
      )
      .all(tableId) as { record_id: string; data: string | null; at_ms: number }[]
  ).map((row) => ({
    recordId: row.record_id,
    data: row.data === null ? null : (JSON.parse(row.data) as RecordData),
    atMs: row.at_ms,
  }))
}
