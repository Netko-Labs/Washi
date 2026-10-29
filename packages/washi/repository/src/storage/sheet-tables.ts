import type { TablePage } from '@washi/domain'
import type { Workspace } from './client'

export function writeSheetTables(ws: Workspace, src: string, tables: string[]): void {
  ws.sqlite.query('DELETE FROM sheet_tables WHERE src = ?').run(src)
  const add = ws.sqlite.query('INSERT OR IGNORE INTO sheet_tables (src, table_name) VALUES (?, ?)')
  for (const name of tables) add.run(src, name)
}

/** The live pages that show each table, by table name; a trashed page shows nothing. */
export function pagesShowingTables(ws: Workspace): Map<string, TablePage[]> {
  const rows = ws.sqlite
    .query(
      `SELECT st.table_name AS tableName, s.id, s.title, s.icon
       FROM sheet_tables st JOIN sheets s ON s.id = st.src
       WHERE s.deleted_at IS NULL ORDER BY s.title, s.id`,
    )
    .all() as (TablePage & { tableName: string })[]
  const out = new Map<string, TablePage[]>()
  for (const { tableName, ...page } of rows) {
    out.set(tableName, [...(out.get(tableName) ?? []), page])
  }
  return out
}

/** Live rows per live table, and the newest change to its spec or any row. */
export function tableStats(ws: Workspace): Map<string, { rows: number; updated: string }> {
  const rows = ws.sqlite
    .query(
      `SELECT t.id, COUNT(r.id) AS rows,
         MAX(t.hlc_updated, COALESCE(MAX(r.hlc_updated), '')) AS updated
       FROM user_tables t
       LEFT JOIN records r ON r.table_id = t.id AND r.deleted_at IS NULL
       WHERE t.deleted_at IS NULL GROUP BY t.id`,
    )
    .all() as { id: string; rows: number; updated: string }[]
  return new Map(rows.map(({ id, ...stats }) => [id, stats]))
}
