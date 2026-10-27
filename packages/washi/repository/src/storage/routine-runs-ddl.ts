import type { Database } from 'bun:sqlite'

function addColumn(sqlite: Database, column: string) {
  const columns = sqlite.query('PRAGMA table_info(routines)').all() as { name: string }[]
  if (!columns.some((entry) => entry.name === column)) {
    sqlite.exec(`ALTER TABLE routines ADD COLUMN ${column} TEXT`)
  }
}

/**
 * D68: a routine's schedule is cron and every run is recorded. A routine from before keeps its
 * meaning — "every day at 07:00" — and its last run, as the wall key of that day's minute.
 */
export function ensureRoutineRuns(sqlite: Database): void {
  addColumn(sqlite, 'cron')
  addColumn(sqlite, 'last_run_at')
  sqlite.exec(`
    UPDATE routines SET
      cron = (minute_of_day % 60) || ' ' || (minute_of_day / 60) || ' * * *',
      last_run_at = CASE WHEN last_run_day IS NULL THEN NULL
        ELSE last_run_day || 'T' || printf('%02d:%02d', minute_of_day / 60, minute_of_day % 60) END
    WHERE cron IS NULL
  `)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS routine_runs (
      id TEXT PRIMARY KEY,
      routine_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      trigger TEXT NOT NULL,
      started_at TEXT NOT NULL
    )
  `)
  sqlite.exec(
    'CREATE INDEX IF NOT EXISTS idx_routine_runs_routine ON routine_runs(routine_id, started_at)',
  )
}
