import type { Database } from 'bun:sqlite'
import type { Suggestion } from '@washi/domain'
import type { RecordData } from '@washi/ink'
import { newId, type Workspace } from './client'
import type { SuggestionDecision, SuggestionRecord, SuggestionWrite } from './types'

/** D120. A visitor's row waits here until a member approves it; the raw IP is never kept. */
export function ensureSuggestions(sqlite: Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS suggestions (
      id TEXT PRIMARY KEY,
      sheet_id TEXT NOT NULL,
      table_name TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'row',
      date_column TEXT,
      cells TEXT NOT NULL,
      visitor_name TEXT NOT NULL,
      visitor_email TEXT NOT NULL,
      ip_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      decided_by TEXT,
      decided_at TEXT,
      record_id TEXT
    )
  `)
  sqlite.exec('CREATE INDEX IF NOT EXISTS idx_suggestions_ip ON suggestions(ip_hash, created_at)')
  sqlite.exec('CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status, sheet_id)')
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS suggestion_reads (
      suggestion_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      read_at TEXT NOT NULL,
      PRIMARY KEY (suggestion_id, user_id)
    )
  `)
}

const COLUMNS = `s.id, s.sheet_id AS sheetId, s.table_name AS tableName, s.kind,
  s.date_column AS dateColumn, s.cells, s.visitor_name AS visitorName,
  s.visitor_email AS visitorEmail, s.status, s.created_at AS hlcCreated`

type Stored = Omit<SuggestionRecord, 'cells'> & { cells: string }

const readCells = (text: string): RecordData => {
  try {
    return JSON.parse(text) as RecordData
  } catch {
    return {}
  }
}

const recordOf = ({ cells, ...row }: Stored): SuggestionRecord => ({
  ...row,
  cells: readCells(cells),
})

/** An HLC stamp sorts by its zero-padded wall clock, so a bare clock is a lower bound. */
const stampAt = (ms: number) => String(ms).padStart(14, '0')

export function insertSuggestion(ws: Workspace, write: SuggestionWrite): string {
  const id = newId()
  ws.sqlite
    .query(
      `INSERT INTO suggestions (id, sheet_id, table_name, kind, date_column, cells, visitor_name,
         visitor_email, ip_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      write.sheetId,
      write.tableName,
      write.kind,
      write.dateColumn,
      JSON.stringify(write.cells),
      write.visitorName,
      write.visitorEmail,
      write.ipHash,
      ws.now(),
    )
  return id
}

export function getSuggestion(ws: Workspace, id: string): SuggestionRecord | null {
  const row = ws.sqlite
    .query(`SELECT ${COLUMNS} FROM suggestions s WHERE s.id = ?`)
    .get(id) as Stored | null
  return row ? recordOf(row) : null
}

/** How many this hashed address sent since `sinceMs`, whatever became of them. */
export function countSuggestionsSince(ws: Workspace, ipHash: string, sinceMs: number): number {
  const row = ws.sqlite
    .query('SELECT COUNT(*) AS n FROM suggestions WHERE ip_hash = ? AND created_at >= ?')
    .get(ipHash, stampAt(sinceMs)) as { n: number }
  return row.n
}

export function countPendingOnSheet(ws: Workspace, sheetId: string): number {
  const row = ws.sqlite
    .query("SELECT COUNT(*) AS n FROM suggestions WHERE sheet_id = ? AND status = 'pending'")
    .get(sheetId) as { n: number }
  return row.n
}

/** Every pending suggestion for a table, from any page: a requested time is held everywhere. */
export function pendingSuggestionsFor(ws: Workspace, table: string): SuggestionRecord[] {
  const rows = ws.sqlite
    .query(
      `SELECT ${COLUMNS} FROM suggestions s WHERE s.table_name = ? AND s.status = 'pending'
       ORDER BY s.created_at`,
    )
    .all(table) as Stored[]
  return rows.map(recordOf)
}

/**
 * Pending suggestions on the live pages named, newest first, with whether this person has read
 * each. The pages filter before the cap, so others' pages never crowd out the reader's.
 */
export function listPendingSuggestions(
  ws: Workspace,
  userId: string,
  sheetIds: string[],
  limit = 200,
): Suggestion[] {
  const rows = ws.sqlite
    .query(
      `SELECT ${COLUMNS}, p.title AS sheetTitle, x.read_at AS readAt
       FROM suggestions s
       JOIN sheets p ON p.id = s.sheet_id AND p.deleted_at IS NULL
       LEFT JOIN suggestion_reads x ON x.suggestion_id = s.id AND x.user_id = ?1
       WHERE s.status = 'pending' AND s.sheet_id IN (SELECT value FROM json_each(?3))
       ORDER BY s.created_at DESC LIMIT ?2`,
    )
    .all(userId, limit, JSON.stringify(sheetIds)) as (Stored & {
    sheetTitle: string
    readAt: string | null
  })[]
  return rows.map(({ readAt, sheetTitle, ...row }) => ({
    ...recordOf(row),
    sheetTitle,
    isRead: readAt !== null,
  }))
}

/** False when it was decided already: two members pressing at once land one row. */
export function decideSuggestion(
  ws: Workspace,
  id: string,
  { status, by, recordId }: SuggestionDecision,
): boolean {
  const { changes } = ws.sqlite
    .query(
      `UPDATE suggestions SET status = ?, decided_by = ?, decided_at = ?, record_id = ?
       WHERE id = ? AND status = 'pending'`,
    )
    .run(status, by, ws.now(), recordId, id)
  return changes > 0
}

export function markSuggestionsRead(ws: Workspace, userId: string, ids: string[]): void {
  const stamp = ws.now()
  const mark = ws.sqlite.query(
    'INSERT OR IGNORE INTO suggestion_reads (suggestion_id, user_id, read_at) VALUES (?, ?, ?)',
  )
  ws.sqlite.transaction(() => {
    for (const id of ids) mark.run(id, userId, stamp)
  })()
}
