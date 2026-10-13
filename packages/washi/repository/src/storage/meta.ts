import { appMetaTable } from '@washi/domain/db'
import { eq } from 'drizzle-orm'
import type { Workspace } from './client'

export function getAppMeta(ws: Workspace, key: string): string | null {
  const [row] = ws.db.select().from(appMetaTable).where(eq(appMetaTable.key, key)).all()
  return row?.value ?? null
}

export function setAppMeta(ws: Workspace, key: string, value: string): void {
  ws.db
    .insert(appMetaTable)
    .values({ key, value })
    .onConflictDoUpdate({ target: appMetaTable.key, set: { value } })
    .run()
}
