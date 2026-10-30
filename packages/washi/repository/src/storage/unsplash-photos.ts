import type { Database } from 'bun:sqlite'
import type { UnsplashPhotoRow } from '@washi/domain'
import { unsplashPhotoTable } from '@washi/domain/db'
import { asc, eq } from 'drizzle-orm'
import type { Workspace } from './client'
import { appendOp } from './oplog'

export function ensureUnsplashPhotos(sqlite: Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS unsplash_photos (
      id TEXT PRIMARY KEY,
      regular_url TEXT NOT NULL,
      full_url TEXT NOT NULL,
      photographer TEXT NOT NULL,
      profile_url TEXT NOT NULL,
      page_url TEXT NOT NULL,
      picked_by TEXT,
      hlc_picked TEXT NOT NULL
    )
  `)
}

/** Picked again, a photo takes what Unsplash says of it now: a renamed photographer stays credited. */
export function keepUnsplashPhoto(
  ws: Workspace,
  photo: Omit<UnsplashPhotoRow, 'pickedBy' | 'hlcPicked'>,
  pickedBy: string | null,
): UnsplashPhotoRow {
  const row = { ...photo, pickedBy, hlcPicked: ws.now() }
  ws.sqlite.transaction(() => {
    ws.db
      .insert(unsplashPhotoTable)
      .values(row)
      .onConflictDoUpdate({ target: unsplashPhotoTable.id, set: row })
      .run()
    appendOp(ws, 'unsplash_photo', row.id, { kind: 'keep', ...row })
  })()
  return row
}

export function listUnsplashPhotos(ws: Workspace): UnsplashPhotoRow[] {
  return ws.db.select().from(unsplashPhotoTable).orderBy(asc(unsplashPhotoTable.id)).all()
}

export function getUnsplashPhoto(ws: Workspace, id: string): UnsplashPhotoRow | null {
  const [row] = ws.db.select().from(unsplashPhotoTable).where(eq(unsplashPhotoTable.id, id)).all()
  return row ?? null
}
