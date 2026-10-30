// conventions: >300 lines — the workspace DDL is one ordered script; split when next touched
import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { createHlcClock, positionBetween } from '@washi/domain'
import * as schema from '@washi/domain/db'
import { type BunSQLiteDatabase, drizzle } from 'drizzle-orm/bun-sqlite'
import { backfillChanges } from './changes-backfill'
import { ensureChangeAuthors } from './changes-ddl'
import { ensureChatSearch } from './chat-search'
import { ensureCustomEmojis } from './custom-emojis'
import { ensureReminders } from './reminders'
import { ensureRoutineRuns } from './routine-runs-ddl'
import { ensureUnsplashPhotos } from './unsplash-photos'
import { ensureWorkspaceThemes } from './workspace-themes'

export type DrizzleDB = BunSQLiteDatabase<typeof schema>

/**
 * One open workspace: a SQLite file plus the clock stamping its writes. Every
 * repository op takes one. There is no ambient handle — a server holds many of
 * these at once, and a leaked query must not be able to cross workspaces.
 */
export interface Workspace {
  readonly id: string
  readonly db: DrizzleDB
  readonly sqlite: Database
  readonly deviceId: string
  now(): string
  close(): void
}

export interface OpenWorkspaceOptions {
  id: string
  /** Filesystem path, or ':memory:' for tests. */
  path: string
}

export function openWorkspace({ id, path }: OpenWorkspaceOptions): Workspace {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })

  const sqlite = new Database(path, { create: true })
  sqlite.exec('PRAGMA journal_mode = WAL')
  sqlite.exec('PRAGMA foreign_keys = ON')

  const db = drizzle(sqlite, { schema })
  createTables(sqlite)
  const hlc = createHlcClock(ensureDeviceId(sqlite))

  return {
    id,
    db,
    sqlite,
    deviceId: hlc.deviceId,
    now: () => hlc.now(),
    close: () => sqlite.close(),
  }
}

export function newId(): string {
  return Bun.randomUUIDv7()
}

function ensureDeviceId(sqlite: Database): string {
  const row = sqlite.query("SELECT value FROM app_meta WHERE key = 'device_id'").get() as {
    value: string
  } | null
  if (row) return row.value
  const id = crypto.randomUUID().slice(0, 8)
  sqlite.query("INSERT INTO app_meta (key, value) VALUES ('device_id', ?)").run(id)
  return id
}

function createTables(sqlite: Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sheets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      icon TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      source TEXT NOT NULL,
      loro_snapshot BLOB NOT NULL,
      hlc_created TEXT NOT NULL,
      hlc_updated TEXT NOT NULL,
      deleted_at TEXT
    )
  `)
  ensureColumn(sqlite, 'sheets', 'parent_id', 'TEXT')
  ensureColumn(sqlite, 'sheets', 'position', 'TEXT')
  ensureColumn(sqlite, 'sheets', 'cover', 'TEXT')
  ensureColumn(sqlite, 'sheets', 'full_width', 'INTEGER NOT NULL DEFAULT 0')
  ensureColumn(sqlite, 'sheets', 'edited_by', 'TEXT')
  ensureColumn(sqlite, 'sheets', 'row_id', 'TEXT')
  ensureColumn(sqlite, 'sheets', 'visibility', "TEXT NOT NULL DEFAULT 'shared'")
  ensureColumn(sqlite, 'sheets', 'access', "TEXT NOT NULL DEFAULT '[]'")
  sqlite.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_sheets_row ON sheets(row_id)')
  sqlite.exec('CREATE INDEX IF NOT EXISTS idx_sheets_parent ON sheets(parent_id, position)')
  backfillPositions(sqlite)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sheet_shares (
      token TEXT PRIMARY KEY,
      sheet_id TEXT NOT NULL,
      created_by TEXT,
      created_at TEXT NOT NULL,
      revoked_at TEXT
    )
  `)
  sqlite.exec('CREATE INDEX IF NOT EXISTS idx_sheet_shares ON sheet_shares(sheet_id)')

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sheet_revisions (
      id TEXT PRIMARY KEY,
      sheet_id TEXT NOT NULL,
      title TEXT NOT NULL,
      icon TEXT,
      source TEXT NOT NULL,
      hlc_created TEXT NOT NULL
    )
  `)
  sqlite.exec(
    'CREATE INDEX IF NOT EXISTS idx_sheet_revisions ON sheet_revisions(sheet_id, hlc_created)',
  )

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sheet_links (
      src TEXT NOT NULL,
      dst TEXT NOT NULL,
      PRIMARY KEY (src, dst)
    )
  `)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sheet_files (
      src TEXT NOT NULL,
      key TEXT NOT NULL,
      PRIMARY KEY (src, key)
    )
  `)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sheet_tables (
      src TEXT NOT NULL,
      table_name TEXT NOT NULL,
      PRIMARY KEY (src, table_name)
    )
  `)
  sqlite.exec('CREATE INDEX IF NOT EXISTS idx_sheet_tables ON sheet_tables(table_name)')
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sheet_automations (
      src TEXT NOT NULL,
      position INTEGER NOT NULL,
      table_name TEXT NOT NULL,
      event TEXT NOT NULL,
      title TEXT,
      source TEXT NOT NULL,
      PRIMARY KEY (src, position)
    )
  `)
  sqlite.exec(
    'CREATE INDEX IF NOT EXISTS idx_sheet_automations ON sheet_automations(table_name, event)',
  )
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sheet_formulas (
      src TEXT NOT NULL,
      position INTEGER NOT NULL,
      name TEXT NOT NULL,
      source TEXT NOT NULL,
      PRIMARY KEY (src, position)
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user_tables (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      spec TEXT NOT NULL,
      hlc_created TEXT NOT NULL,
      hlc_updated TEXT NOT NULL,
      deleted_at TEXT
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL,
      data TEXT NOT NULL,
      hlc_created TEXT NOT NULL,
      hlc_updated TEXT NOT NULL,
      deleted_at TEXT
    )
  `)
  sqlite.exec('CREATE INDEX IF NOT EXISTS idx_records_table ON records(table_id)')

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS record_changes (
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id TEXT NOT NULL,
      record_id TEXT NOT NULL,
      data TEXT,
      at_ms INTEGER NOT NULL
    )
  `)
  sqlite.exec('CREATE INDEX IF NOT EXISTS idx_record_changes ON record_changes(table_id, at_ms)')
  ensureChangeAuthors(sqlite)
  backfillChanges(sqlite)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS agent_sessions (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL DEFAULT 'claude',
      title TEXT NOT NULL,
      sdk_session_id TEXT,
      status TEXT NOT NULL DEFAULT 'idle',
      cost_usd REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS agent_turns (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      seq INTEGER NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `)
  sqlite.exec('CREATE INDEX IF NOT EXISTS idx_agent_turns_session ON agent_turns(session_id, seq)')

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      input TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      resolved_by TEXT
    )
  `)
  ensureColumn(sqlite, 'approvals', 'resolved_by', 'TEXT')
  ensureColumn(sqlite, 'agent_sessions', 'model', 'TEXT')
  ensureColumn(sqlite, 'agent_sessions', 'effort', 'TEXT')
  ensureColumn(sqlite, 'agent_sessions', 'approvals', 'TEXT')
  ensureColumn(sqlite, 'agent_sessions', 'created_by', 'TEXT')
  ensureColumn(sqlite, 'agent_sessions', 'anchor_sheet_id', 'TEXT')
  ensureColumn(sqlite, 'agent_sessions', 'anchor_scope', 'TEXT')

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS capability_calls (
      id TEXT PRIMARY KEY,
      origin TEXT NOT NULL,
      actor_id TEXT,
      subject TEXT NOT NULL,
      input TEXT,
      decision TEXT NOT NULL,
      detail TEXT,
      created_at TEXT NOT NULL
    )
  `)
  ensureColumn(sqlite, 'capability_calls', 'actor_id', 'TEXT')
  sqlite.exec(
    'CREATE INDEX IF NOT EXISTS idx_capability_calls_created ON capability_calls(created_at DESC)',
  )

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS oplog (
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      op_id TEXT NOT NULL,
      device_id TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      op TEXT NOT NULL
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS agent_spend (
      day TEXT PRIMARY KEY,
      cost_usd REAL NOT NULL DEFAULT 0,
      saved_usd REAL NOT NULL DEFAULT 0,
      turns INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    )
  `)
  ensureColumn(sqlite, 'agent_spend', 'saved_usd', 'REAL NOT NULL DEFAULT 0')

  // The first routines shape (UTC minutes) never shipped; a dev file that has it
  // is rebuilt rather than migrated.
  if (hasColumn(sqlite, 'routines', 'minute_utc')) sqlite.exec('DROP TABLE routines')
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS routines (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      prompt TEXT NOT NULL,
      minute_of_day INTEGER NOT NULL,
      time_zone TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      last_run_day TEXT,
      session_id TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL
    )
  `)
  ensureRoutineRuns(sqlite)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      sheet_id TEXT NOT NULL,
      thread_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      body TEXT NOT NULL,
      mentions TEXT NOT NULL DEFAULT '[]',
      resolved INTEGER NOT NULL DEFAULT 0,
      hlc_created TEXT NOT NULL
    )
  `)
  sqlite.exec('CREATE INDEX IF NOT EXISTS idx_comments_sheet ON comments(sheet_id, hlc_created)')
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mime TEXT NOT NULL,
      size INTEGER NOT NULL,
      hlc_created TEXT NOT NULL
    )
  `)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS mention_inbox (
      user_id TEXT NOT NULL,
      comment_id TEXT NOT NULL,
      sheet_id TEXT NOT NULL,
      read_at TEXT,
      PRIMARY KEY (user_id, comment_id)
    )
  `)

  sqlite.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS sheets_fts USING fts5(id UNINDEXED, title, body)
  `)

  ensureChatSearch(sqlite)
  ensureCustomEmojis(sqlite)
  ensureWorkspaceThemes(sqlite)
  ensureReminders(sqlite)
  ensureUnsplashPhotos(sqlite)

  // window_state used to live here. A server has no windows — it moved to the
  // desktop client's own store.
  sqlite.exec('DROP TABLE IF EXISTS window_state')
}

/** Pages from before nesting keep the order they were listed in: most recently edited first. */
function backfillPositions(sqlite: Database) {
  const unplaced = sqlite
    .query('SELECT id FROM sheets WHERE position IS NULL ORDER BY hlc_updated DESC')
    .all() as { id: string }[]
  if (unplaced.length === 0) return
  const last = sqlite
    .query('SELECT MAX(position) AS position FROM sheets WHERE parent_id IS NULL')
    .get() as { position: string | null }
  let position = last.position
  const place = sqlite.query('UPDATE sheets SET position = ? WHERE id = ?')
  for (const { id } of unplaced) {
    position = positionBetween(position, null)
    place.run(position, id)
  }
}

/** Additive DDL for an existing file; no drizzle-kit migrations by design. */
function hasColumn(sqlite: Database, table: string, column: string): boolean {
  const columns = sqlite.query(`PRAGMA table_info(${table})`).all() as { name: string }[]
  return columns.some((entry) => entry.name === column)
}

function ensureColumn(sqlite: Database, table: string, column: string, type: string) {
  if (hasColumn(sqlite, table, column)) return
  sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`)
}
