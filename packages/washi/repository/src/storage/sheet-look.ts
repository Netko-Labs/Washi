import type { SheetLook } from '@washi/domain'
import { sheetTable } from '@washi/domain/db'
import { eq } from 'drizzle-orm'
import type { Workspace } from './client'
import { updateSnapshot } from './loro'

/** Pages whose cached icon or cover may not be in their source yet — what the D64 lift reads. */
export function sheetsWearingLooks(ws: Workspace) {
  return ws.sqlite
    .query('SELECT id, source, icon, cover FROM sheets WHERE icon IS NOT NULL OR cover IS NOT NULL')
    .all() as { id: string; source: string; icon: string | null; cover: string | null }[]
}

/**
 * Writes a source that only moved the look in: no edit stamp, no author, Washi's undo stack
 * untouched — the page reads as it did, it just carries its own cover now.
 */
export function rewriteSourceQuietly(
  ws: Workspace,
  id: string,
  source: string,
  look: SheetLook,
): void {
  const [sheet] = ws.db.select().from(sheetTable).where(eq(sheetTable.id, id)).all()
  if (!sheet) return
  ws.db
    .update(sheetTable)
    .set({
      source,
      loroSnapshot: Buffer.from(updateSnapshot(sheet.loroSnapshot, source)),
      icon: look.icon,
      cover: look.cover,
    })
    .where(eq(sheetTable.id, id))
    .run()
}
