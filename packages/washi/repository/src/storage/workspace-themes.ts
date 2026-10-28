import type { Database } from 'bun:sqlite'
import type { WorkspaceTheme, WorkspaceThemeWrite } from '@washi/domain'
import { workspaceThemeTable } from '@washi/domain/db'
import { asc, eq } from 'drizzle-orm'
import { newId, type Workspace } from './client'
import { appendOp } from './oplog'

export function ensureWorkspaceThemes(sqlite: Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS workspace_themes (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      light TEXT NOT NULL,
      dark TEXT NOT NULL,
      created_by TEXT NOT NULL,
      hlc_created TEXT NOT NULL,
      hlc_updated TEXT NOT NULL
    )
  `)
}

const fromRow = (row: typeof workspaceThemeTable.$inferSelect): WorkspaceTheme => ({
  ...row,
  light: JSON.parse(row.light),
  dark: JSON.parse(row.dark),
})

export function listWorkspaceThemes(ws: Workspace): WorkspaceTheme[] {
  return ws.db
    .select()
    .from(workspaceThemeTable)
    .orderBy(asc(workspaceThemeTable.name))
    .all()
    .map(fromRow)
}

export function getWorkspaceTheme(ws: Workspace, id: string): WorkspaceTheme | null {
  const [row] = ws.db.select().from(workspaceThemeTable).where(eq(workspaceThemeTable.id, id)).all()
  return row ? fromRow(row) : null
}

export function workspaceThemeBySlug(ws: Workspace, slug: string): WorkspaceTheme | null {
  const [row] = ws.db
    .select()
    .from(workspaceThemeTable)
    .where(eq(workspaceThemeTable.slug, slug))
    .all()
  return row ? fromRow(row) : null
}

/** The slug is unique in the table; the caller picks a free one first. */
export function createWorkspaceTheme(
  ws: Workspace,
  write: WorkspaceThemeWrite & { slug: string },
  createdBy: string,
): WorkspaceTheme {
  const now = ws.now()
  const row = {
    id: newId(),
    slug: write.slug,
    name: write.name,
    light: JSON.stringify(write.light),
    dark: JSON.stringify(write.dark),
    createdBy,
    hlcCreated: now,
    hlcUpdated: now,
  }
  ws.sqlite.transaction(() => {
    ws.db.insert(workspaceThemeTable).values(row).run()
    appendOp(ws, 'workspace_theme', row.id, { kind: 'create', ...row })
  })()
  return fromRow(row)
}

export function updateWorkspaceTheme(
  ws: Workspace,
  id: string,
  write: WorkspaceThemeWrite,
): WorkspaceTheme | null {
  const patch = {
    name: write.name,
    light: JSON.stringify(write.light),
    dark: JSON.stringify(write.dark),
    hlcUpdated: ws.now(),
  }
  ws.sqlite.transaction(() => {
    ws.db.update(workspaceThemeTable).set(patch).where(eq(workspaceThemeTable.id, id)).run()
    appendOp(ws, 'workspace_theme', id, { kind: 'update', ...patch })
  })()
  return getWorkspaceTheme(ws, id)
}

export function deleteWorkspaceTheme(ws: Workspace, id: string): boolean {
  return ws.sqlite.transaction(() => {
    const { changes } = ws.sqlite.query('DELETE FROM workspace_themes WHERE id = ?').run(id)
    if (changes > 0) appendOp(ws, 'workspace_theme', id, { kind: 'delete' })
    return changes > 0
  })()
}
