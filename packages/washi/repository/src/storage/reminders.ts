import type { Database } from 'bun:sqlite'
import type { Reminder, ReminderHit } from '@washi/domain'
import { reminderTable } from '@washi/domain/db'
import { asc, eq } from 'drizzle-orm'
import { newId, type Workspace } from './client'
import type { HitRow, HitWrite, ReminderPatch, ReminderWrite } from './types'

/** D77. A hit is unique per row per due date, so a minute clock reminds once, not every minute. */
export function ensureReminders(sqlite: Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      table_name TEXT NOT NULL,
      date_column TEXT NOT NULL,
      days_before INTEGER NOT NULL,
      where_json TEXT NOT NULL DEFAULT '[]',
      person_column TEXT,
      time_zone TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_by TEXT,
      created_at TEXT NOT NULL
    )
  `)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS reminder_hits (
      id TEXT PRIMARY KEY,
      reminder_id TEXT NOT NULL,
      record_id TEXT NOT NULL,
      due_day TEXT NOT NULL,
      row_title TEXT NOT NULL,
      recipient TEXT,
      hlc_created TEXT NOT NULL
    )
  `)
  sqlite.exec(
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_reminder_hits ON reminder_hits(reminder_id, record_id, due_day)',
  )
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS reminder_reads (
      hit_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      read_at TEXT NOT NULL,
      PRIMARY KEY (hit_id, user_id)
    )
  `)
}

export function listReminders(ws: Workspace): Reminder[] {
  return ws.db.select().from(reminderTable).orderBy(asc(reminderTable.createdAt)).all()
}

export function getReminder(ws: Workspace, id: string): Reminder | null {
  return ws.db.select().from(reminderTable).where(eq(reminderTable.id, id)).get() ?? null
}

export function createReminder(ws: Workspace, write: ReminderWrite): Reminder {
  const id = newId()
  ws.db
    .insert(reminderTable)
    .values({ ...write, id, enabled: true, createdAt: ws.now() })
    .run()
  return getReminder(ws, id) as Reminder
}

export function updateReminder(ws: Workspace, id: string, patch: ReminderPatch): Reminder | null {
  ws.db.update(reminderTable).set(patch).where(eq(reminderTable.id, id)).run()
  return getReminder(ws, id)
}

/** Its hits go with it: an Inbox row for a rule nobody keeps any more is noise. */
export function deleteReminder(ws: Workspace, id: string): void {
  ws.sqlite.transaction(() => {
    ws.sqlite
      .query(
        'DELETE FROM reminder_reads WHERE hit_id IN (SELECT id FROM reminder_hits WHERE reminder_id = ?)',
      )
      .run(id)
    ws.sqlite.query('DELETE FROM reminder_hits WHERE reminder_id = ?').run(id)
    ws.sqlite.query('DELETE FROM reminders WHERE id = ?').run(id)
  })()
}

/** False when this row already reminded for this due date. */
export function recordReminderHit(ws: Workspace, hit: HitWrite): boolean {
  const { changes } = ws.sqlite
    .query(
      `INSERT OR IGNORE INTO reminder_hits
         (id, reminder_id, record_id, due_day, row_title, recipient, hlc_created)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(newId(), hit.reminderId, hit.recordId, hit.dueDay, hit.rowTitle, hit.recipient, ws.now())
  return changes > 0
}

/** Everyone's hits, and the ones naming this person; a deleted row's hit is gone with it. */
const VISIBLE = `FROM reminder_hits h
  JOIN reminders m ON m.id = h.reminder_id
  JOIN records r ON r.id = h.record_id AND r.deleted_at IS NULL
  LEFT JOIN reminder_reads x ON x.hit_id = h.id AND x.user_id = ?1
  WHERE (h.recipient IS NULL OR h.recipient = ?1)`

export function listReminderHits(ws: Workspace, userId: string, limit = 50): ReminderHit[] {
  const rows = ws.sqlite
    .query(
      `SELECT h.id, h.reminder_id AS reminderId, m.title AS reminderTitle, h.record_id AS recordId,
         h.row_title AS rowTitle, h.due_day AS dueDay, h.hlc_created AS hlcCreated,
         x.read_at AS readAt
       ${VISIBLE} ORDER BY h.hlc_created DESC LIMIT ?2`,
    )
    .all(userId, limit) as HitRow[]
  return rows.map(({ readAt, ...hit }) => ({ ...hit, isRead: readAt !== null }))
}

export function countUnreadReminderHits(ws: Workspace, userId: string): number {
  const row = ws.sqlite
    .query(`SELECT COUNT(*) AS n ${VISIBLE} AND x.read_at IS NULL`)
    .get(userId) as { n: number }
  return row.n
}

/** The given hits, or every one this person can see when none are named. */
export function markReminderHitsRead(ws: Workspace, userId: string, hitIds?: string[]): void {
  const ids =
    hitIds ??
    (
      ws.sqlite.query(`SELECT h.id ${VISIBLE} AND x.read_at IS NULL`).all(userId) as {
        id: string
      }[]
    ).map((row) => row.id)
  const stamp = ws.now()
  const mark = ws.sqlite.query(
    'INSERT OR IGNORE INTO reminder_reads (hit_id, user_id, read_at) VALUES (?, ?, ?)',
  )
  ws.sqlite.transaction(() => {
    for (const id of ids) mark.run(id, userId, stamp)
  })()
}
