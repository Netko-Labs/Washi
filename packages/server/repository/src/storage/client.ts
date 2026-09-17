import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { createHlcClock } from '@washi/domain'
import * as schema from '@washi/domain/db'
import { type BunSQLiteDatabase, drizzle } from 'drizzle-orm/bun-sqlite'

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

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sheet_links (
      src TEXT NOT NULL,
      dst TEXT NOT NULL,
      PRIMARY KEY (src, dst)
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
      resolved_at TEXT
    )
  `)

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
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  sqlite.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS sheets_fts USING fts5(id UNINDEXED, title, body)
  `)

  // window_state used to live here. A server has no windows — it moved to the
  // desktop client's own store.
  sqlite.exec('DROP TABLE IF EXISTS window_state')
}

/** Additive DDL for an existing file; no drizzle-kit migrations by design. */
function ensureColumn(sqlite: Database, table: string, column: string, type: string) {
  const columns = sqlite.query(`PRAGMA table_info(${table})`).all() as { name: string }[]
  if (columns.some((entry) => entry.name === column)) return
  sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`)
}
