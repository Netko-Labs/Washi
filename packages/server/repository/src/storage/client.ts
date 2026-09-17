import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { createHlcClock, type HlcClock } from '@washi/domain'
import * as schema from '@washi/domain/db'
import { type BunSQLiteDatabase, drizzle } from 'drizzle-orm/bun-sqlite'

export type DrizzleDB = BunSQLiteDatabase<typeof schema>

let _db: DrizzleDB | null = null
let _sqlite: Database | null = null
let _hlc: HlcClock | null = null

export function initializeDb(dbPath: string): void {
  if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true })

  _sqlite = new Database(dbPath, { create: true })
  _sqlite.exec('PRAGMA journal_mode = WAL')
  _sqlite.exec('PRAGMA foreign_keys = ON')

  _db = drizzle(_sqlite, { schema })
  createTables(_sqlite)
  _hlc = createHlcClock(ensureDeviceId(_sqlite))
}

export function closeDb(): void {
  _sqlite?.close()
  _db = null
  _sqlite = null
  _hlc = null
}

export function getDb(): DrizzleDB {
  if (!_db) throw new Error('database not initialized — call initializeDb() first')
  return _db
}

export function getSqlite(): Database {
  if (!_sqlite) throw new Error('database not initialized — call initializeDb() first')
  return _sqlite
}

export function hlcNow(): string {
  if (!_hlc) throw new Error('database not initialized — call initializeDb() first')
  return _hlc.now()
}

export function deviceId(): string {
  if (!_hlc) throw new Error('database not initialized — call initializeDb() first')
  return _hlc.deviceId
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
      subject TEXT NOT NULL,
      input TEXT,
      decision TEXT NOT NULL,
      detail TEXT,
      created_at TEXT NOT NULL
    )
  `)
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
    CREATE TABLE IF NOT EXISTS window_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      is_maximized INTEGER NOT NULL DEFAULT 0
    )
  `)

  sqlite.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS sheets_fts USING fts5(id UNINDEXED, title, body)
  `)
}
