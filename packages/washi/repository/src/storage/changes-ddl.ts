import type { Database } from 'bun:sqlite'

/** D78: who wrote each version. Older versions stay null — nobody can say now. */
export function ensureChangeAuthors(sqlite: Database): void {
  const columns = sqlite.query('PRAGMA table_info(record_changes)').all() as { name: string }[]
  if (!columns.some((column) => column.name === 'author')) {
    sqlite.exec('ALTER TABLE record_changes ADD COLUMN author TEXT')
  }
  sqlite.exec(
    'CREATE INDEX IF NOT EXISTS idx_record_changes_record ON record_changes(record_id, at_ms)',
  )
}
