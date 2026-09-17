import { DEFAULT_WINDOW_STATE, type WindowState } from '@washi/domain'
import { appMetaTable, windowStateTable } from '@washi/domain/db'
import { eq } from 'drizzle-orm'
import { getDb } from './client'

export function getAppMeta(key: string): string | null {
  const [row] = getDb().select().from(appMetaTable).where(eq(appMetaTable.key, key)).all()
  return row?.value ?? null
}

export function setAppMeta(key: string, value: string): void {
  getDb()
    .insert(appMetaTable)
    .values({ key, value })
    .onConflictDoUpdate({ target: appMetaTable.key, set: { value } })
    .run()
}

export function getWindowState(): WindowState {
  const [row] = getDb().select().from(windowStateTable).where(eq(windowStateTable.id, 1)).all()
  if (!row) return DEFAULT_WINDOW_STATE
  return { x: row.x, y: row.y, width: row.width, height: row.height, isMaximized: row.isMaximized }
}

export function saveWindowState(state: WindowState): void {
  getDb()
    .insert(windowStateTable)
    .values({ id: 1, ...state })
    .onConflictDoUpdate({ target: windowStateTable.id, set: { ...state } })
    .run()
}
