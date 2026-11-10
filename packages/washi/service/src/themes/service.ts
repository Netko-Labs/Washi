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
import { THEME_SLUG, THEME_SLUG_MAX } from './constants'
import type { DefinedTheme, ThemeChanger, ThemeDefinition } from './types'

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

function requireMine(ws: Workspace, id: string, by: ThemeChanger) {
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
  by: ThemeChanger,
): WorkspaceTheme {
  requireMine(ws, id, by)
  requireReadable(write)
  requireFreeName(ws, write.name, id)
  const updated = updateWorkspaceTheme(ws, id, write)
  if (!updated) throw new WorkspaceThemeError('no such theme')
  return updated
}

/** Pages that wore it fall back to Washi; their source keeps the key. */
export function removeWorkspaceTheme(ws: Workspace, id: string, by: ThemeChanger): void {
  requireMine(ws, id, by)
  deleteWorkspaceTheme(ws, id)
}

/** Pairings under their `warn` floor, in words: saved, but worth a second look. */
export function themeWarnings(write: WorkspaceThemeWrite): string[] {
  return themeChecks(write)
    .filter((check) => check.verdict === 'warn')
    .map(
      ({ rule, ratio, mode }) =>
        `${rule.label} is ${ratio.toFixed(1)}:1 in ${mode} — it reads best at ${rule.warn}:1`,
    )
}

/**
 * Makes `ws:<slug>` or changes it in place (D139): an outside agent names a theme as its pages
 * will. A new slug is made by `by`; one that exists changes only for its maker or a steward —
 * the same contrast gate and name rule as the Settings editor.
 */
export function defineWorkspaceTheme(
  ws: Workspace,
  definition: ThemeDefinition,
  by: ThemeChanger,
): DefinedTheme {
  const slug = definition.slug.replace(/^ws:/, '')
  if (slug.length > THEME_SLUG_MAX || !THEME_SLUG.test(slug)) {
    throw new WorkspaceThemeError(
      `"${definition.slug}" is not a theme slug — lowercase words joined by hyphens, at most ${THEME_SLUG_MAX} characters, like "mirin-amber"`,
    )
  }
  const write = { name: definition.name, light: definition.light, dark: definition.dark }
  const found = workspaceThemeBySlug(ws, slug)
  if (found) {
    const theme = editWorkspaceTheme(ws, found.id, write, by)
    return { theme, created: false, warnings: themeWarnings(write) }
  }
  requireReadable(write)
  requireFreeName(ws, write.name)
  const theme = createWorkspaceTheme(ws, { ...write, slug }, by.id)
  return { theme, created: true, warnings: themeWarnings(write) }
}
