import type { Workspace } from './client'

export interface StoredAutomation {
  sheetId: string
  position: number
  table: string
  event: 'insert' | 'update'
  title: string | null
  source: string
}

/** The automations a write to `table` runs: only on live pages — a trashed page's sleep. */
export function automationsFor(
  ws: Workspace,
  table: string,
  event: 'insert' | 'update',
): StoredAutomation[] {
  return ws.sqlite
    .query(
      `SELECT a.src AS sheetId, a.position, a.table_name AS "table", a.event, a.title, a.source
       FROM sheet_automations a JOIN sheets s ON s.id = a.src
       WHERE a.table_name = ? AND a.event = ? AND s.deleted_at IS NULL
       ORDER BY a.src, a.position`,
    )
    .all(table, event) as StoredAutomation[]
}

/** A table's name from its id, for a write that only knows the id. */
export function tableNameOf(ws: Workspace, tableId: string): string | null {
  const row = ws.sqlite.query('SELECT name FROM user_tables WHERE id = ?').get(tableId) as {
    name: string
  } | null
  return row?.name ?? null
}
