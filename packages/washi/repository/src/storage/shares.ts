import type { SheetShare } from '@washi/domain'
import { sheetShareTable } from '@washi/domain/db'
import { and, eq, isNull } from 'drizzle-orm'
import type { Workspace } from './client'

const LIVE = {
  token: sheetShareTable.token,
  sheetId: sheetShareTable.sheetId,
  createdBy: sheetShareTable.createdBy,
  createdAt: sheetShareTable.createdAt,
}

export function liveShareFor(ws: Workspace, sheetId: string): SheetShare | null {
  const [row] = ws.db
    .select(LIVE)
    .from(sheetShareTable)
    .where(and(eq(sheetShareTable.sheetId, sheetId), isNull(sheetShareTable.revokedAt)))
    .all()
  return row ?? null
}

export function shareByToken(ws: Workspace, token: string): SheetShare | null {
  const [row] = ws.db
    .select(LIVE)
    .from(sheetShareTable)
    .where(and(eq(sheetShareTable.token, token), isNull(sheetShareTable.revokedAt)))
    .all()
  return row ?? null
}

/** One live link per page; asking again hands back the same one. */
export function openShare(ws: Workspace, sheetId: string, createdBy: string | null): SheetShare {
  const live = liveShareFor(ws, sheetId)
  if (live) return live
  const share = {
    token: Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString('base64url'),
    sheetId,
    createdBy,
    createdAt: ws.now(),
  }
  ws.db.insert(sheetShareTable).values(share).run()
  return share
}

/** A revoked token stays on record and never works again; a new link is a new token. */
export function closeShare(ws: Workspace, sheetId: string): void {
  ws.db
    .update(sheetShareTable)
    .set({ revokedAt: ws.now() })
    .where(and(eq(sheetShareTable.sheetId, sheetId), isNull(sheetShareTable.revokedAt)))
    .run()
}
