import type { SheetLook } from '@washi/domain'
import { sheetRevisionTable, sheetTable } from '@washi/domain/db'
import { and, desc, eq, notInArray } from 'drizzle-orm'
import { newId, type Workspace } from './client'
import { updateSnapshot } from './loro'
import { appendOp } from './oplog'
import { indexSheet } from './sheets'
import type { SheetIndexInput } from './types'

const UNDO_DEPTH = 20

type SheetRow = typeof sheetTable.$inferSelect
export type SheetRevision = typeof sheetRevisionTable.$inferSelect

export function pushRevision(ws: Workspace, sheet: SheetRow): void {
  ws.db
    .insert(sheetRevisionTable)
    .values({
      id: newId(),
      sheetId: sheet.id,
      title: sheet.title,
      icon: sheet.icon,
      source: sheet.source,
      hlcCreated: ws.now(),
    })
    .run()
  const kept = ws.db
    .select({ id: sheetRevisionTable.id })
    .from(sheetRevisionTable)
    .where(eq(sheetRevisionTable.sheetId, sheet.id))
    .orderBy(desc(sheetRevisionTable.hlcCreated))
    .limit(UNDO_DEPTH)
    .all()
    .map((row) => row.id)
  ws.db
    .delete(sheetRevisionTable)
    .where(and(eq(sheetRevisionTable.sheetId, sheet.id), notInArray(sheetRevisionTable.id, kept)))
    .run()
}

export function clearRevisions(ws: Workspace, sheetId: string): void {
  ws.db.delete(sheetRevisionTable).where(eq(sheetRevisionTable.sheetId, sheetId)).run()
}

export function latestRevision(ws: Workspace, sheetId: string): SheetRevision | null {
  const [row] = ws.db
    .select()
    .from(sheetRevisionTable)
    .where(eq(sheetRevisionTable.sheetId, sheetId))
    .orderBy(desc(sheetRevisionTable.hlcCreated))
    .limit(1)
    .all()
  return row ?? null
}

/** Puts back what the page held before Washi's last write; older Washi writes stay undoable. */
export function restoreRevision(
  ws: Workspace,
  revision: SheetRevision,
  index: SheetIndexInput,
  look: SheetLook,
): boolean {
  const [sheet] = ws.db.select().from(sheetTable).where(eq(sheetTable.id, revision.sheetId)).all()
  if (!sheet || sheet.deletedAt) return false
  ws.sqlite.transaction(() => {
    ws.db.delete(sheetRevisionTable).where(eq(sheetRevisionTable.id, revision.id)).run()
    const older = latestRevision(ws, revision.sheetId)
    ws.db
      .update(sheetTable)
      .set({
        title: revision.title,
        icon: look.icon,
        cover: look.cover,
        source: revision.source,
        loroSnapshot: Buffer.from(updateSnapshot(sheet.loroSnapshot, revision.source)),
        editedBy: older ? 'washi' : null,
        hlcUpdated: ws.now(),
      })
      .where(eq(sheetTable.id, sheet.id))
      .run()
    indexSheet(ws, sheet.id, revision.title, index)
    appendOp(ws, 'sheet', sheet.id, { kind: 'undo', revisionId: revision.id })
  })()
  return true
}
