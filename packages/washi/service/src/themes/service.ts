import { themeNameClash, type WorkspaceTheme, type WorkspaceThemeWrite } from '@washi/domain'
import { themeChecks, themeRefusal } from '@washi/paper/registry'
import {
  createWorkspaceTheme,
  deleteWorkspaceTheme,
  getWorkspaceTheme,
  listWorkspaceThemes,
  updateWorkspaceTheme,
  type Workspace,
  workspaceThemeBySlug,
} from '@washi/repository'

export class WorkspaceThemeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WorkspaceThemeError'
  }
}

/** `Kōbai Night!` → `kobai-night`; the slug is what a page names, so it stays plain. */
export function themeSlug(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 34)
  return slug || 'theme'
}

function freeSlug(ws: Workspace, name: string): string {
  const base = themeSlug(name)
  let slug = base
  for (let n = 2; workspaceThemeBySlug(ws, slug); n++) slug = `${base}-${n}`
  return slug
}

function requireReadable(write: WorkspaceThemeWrite): void {
  const refusal = themeRefusal(themeChecks(write))
  if (refusal) throw new WorkspaceThemeError(refusal)
}

function requireFreeName(ws: Workspace, name: string, exceptId: string | null = null): void {
  const clash = themeNameClash(listWorkspaceThemes(ws), name, exceptId)
  if (clash) throw new WorkspaceThemeError(clash)
}

export function addWorkspaceTheme(
  ws: Workspace,
  write: WorkspaceThemeWrite,
  createdBy: string,
): WorkspaceTheme {
  requireReadable(write)
  requireFreeName(ws, write.name)
  return createWorkspaceTheme(ws, { ...write, slug: freeSlug(ws, write.name) }, createdBy)
}

function requireMine(ws: Workspace, id: string, by: { id: string; mayChangeAny: boolean }) {
  const theme = getWorkspaceTheme(ws, id)
  if (!theme) throw new WorkspaceThemeError('no such theme')
  if (theme.createdBy !== by.id && !by.mayChangeAny) {
    throw new WorkspaceThemeError('only the person who made a theme, or an owner, can change it')
  }
  return theme
}

/** A rename keeps the slug, so every page wearing it keeps wearing it. */
export function editWorkspaceTheme(
  ws: Workspace,
  id: string,
  write: WorkspaceThemeWrite,
  by: { id: string; mayChangeAny: boolean },
): WorkspaceTheme {
  requireMine(ws, id, by)
  requireReadable(write)
  requireFreeName(ws, write.name, id)
  const updated = updateWorkspaceTheme(ws, id, write)
  if (!updated) throw new WorkspaceThemeError('no such theme')
  return updated
}

/** Pages that wore it fall back to Washi; their source keeps the key. */
export function removeWorkspaceTheme(
  ws: Workspace,
  id: string,
  by: { id: string; mayChangeAny: boolean },
): void {
  requireMine(ws, id, by)
  deleteWorkspaceTheme(ws, id)
}
