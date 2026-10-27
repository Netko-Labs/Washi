import type { Database } from 'bun:sqlite'
import type { CustomEmoji } from '@washi/domain'
import { customEmojiTable } from '@washi/domain/db'
import { asc, eq } from 'drizzle-orm'
import { newId, type Workspace } from './client'
import { appendOp } from './oplog'

export function ensureCustomEmojis(sqlite: Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS custom_emojis (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      file_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      hlc_created TEXT NOT NULL
    )
  `)
}

export function listCustomEmojis(ws: Workspace): CustomEmoji[] {
  return ws.db.select().from(customEmojiTable).orderBy(asc(customEmojiTable.name)).all()
}

export function getCustomEmoji(ws: Workspace, id: string): CustomEmoji | null {
  const [row] = ws.db.select().from(customEmojiTable).where(eq(customEmojiTable.id, id)).all()
  return row ?? null
}

export function customEmojiNamed(ws: Workspace, name: string): CustomEmoji | null {
  const [row] = ws.db.select().from(customEmojiTable).where(eq(customEmojiTable.name, name)).all()
  return row ?? null
}

/** The name is unique in the table; the caller turns a taken one into words first. */
export function createCustomEmoji(
  ws: Workspace,
  write: { name: string; fileId: string },
  createdBy: string,
): CustomEmoji {
  const row = { id: newId(), ...write, createdBy, hlcCreated: ws.now() }
  ws.sqlite.transaction(() => {
    ws.db.insert(customEmojiTable).values(row).run()
    appendOp(ws, 'custom_emoji', row.id, { kind: 'create', ...row })
  })()
  return row
}

export function deleteCustomEmoji(ws: Workspace, id: string): boolean {
  return ws.sqlite.transaction(() => {
    const { changes } = ws.sqlite.query('DELETE FROM custom_emojis WHERE id = ?').run(id)
    if (changes > 0) appendOp(ws, 'custom_emoji', id, { kind: 'delete' })
    return changes > 0
  })()
}

/** Whether any page, trashed or not, or any emoji still points at the upload. */
export function isUploadWorn(ws: Workspace, fileId: string): boolean {
  const key = `file:${fileId}`
  const row = ws.sqlite
    .query(
      `SELECT 1 FROM sheets WHERE cover = ?1 OR icon = ?1
       UNION ALL SELECT 1 FROM custom_emojis WHERE file_id = ?2 LIMIT 1`,
    )
    .get(key, fileId)
  return row !== null
}
