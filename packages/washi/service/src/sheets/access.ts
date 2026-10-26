import type { AccessRow, SheetAccess, Viewer } from '@washi/domain'
import { redactionWeight } from '@washi/paper/registry'
import { accessRows, closeShare, getSheet, openShare, type Workspace } from '@washi/repository'
import type { WsxElement } from '@washi/wsx'
import { accessOf } from './look-of'

export class SheetNotFoundError extends Error {
  constructor(id: string) {
    super(`no page ${id}`)
    this.name = 'SheetNotFoundError'
  }
}

/** Said to Washi in words when a write would widen who reads a page. */
export class SheetAccessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SheetAccessError'
  }
}

/** The only reader nobody vouched for — a routine — sees what the whole workspace sees. */
export const NOBODY: Viewer = { id: null, isOwner: false }

const opens = (page: AccessRow, viewer: Viewer) =>
  page.visibility !== 'private' ||
  viewer.isOwner ||
  (viewer.id !== null && page.access.includes(viewer.id))

/**
 * A page is as closed as its most closed ancestor, as in Notion: a sub-page of a private page
 * is private to the same people. A page whose parent is gone reads on its own.
 */
export function readableIds(pages: AccessRow[], viewer: Viewer): Set<string> {
  const byId = new Map(pages.map((page) => [page.id, page]))
  const verdict = new Map<string, boolean>()
  const readable = (id: string, depth = 0): boolean => {
    const known = verdict.get(id)
    if (known !== undefined) return known
    const page = byId.get(id)
    if (!page) return true
    const parent = page.parentId && depth < 64 ? readable(page.parentId, depth + 1) : true
    const answer = parent && opens(page, viewer)
    verdict.set(id, answer)
    return answer
  }
  return new Set(pages.filter((page) => readable(page.id)).map((page) => page.id))
}

/** Every page id this viewer may read, live or in the Trash. */
export function readableSet(ws: Workspace, viewer: Viewer): Set<string> {
  return readableIds(accessRows(ws), viewer)
}

/** A page nobody has ever made is "readable": the handler answers it as missing on its own. */
export function canRead(ws: Workspace, id: string, viewer: Viewer): boolean {
  if (viewer.isOwner) return true
  return readableSet(ws, viewer).has(id) || !getSheet(ws, id)
}

/** NOT_FOUND, not FORBIDDEN: someone outside a private page learns nothing about it. */
export function requireReadable(ws: Workspace, id: string, viewer: Viewer): void {
  if (!canRead(ws, id, viewer)) throw new SheetNotFoundError(id)
}

/**
 * Only a person decides who reads a page and what a link leaves out (A2): Washi may not change
 * `visibility` or `access`, nor hide less on a page that is on a public link.
 */
export function guardWashiWrite(before: WsxElement | null, after: WsxElement): void {
  const was = before ? accessOf(before) : { visibility: 'shared', access: [] }
  const now = accessOf(after)
  if (was.visibility !== now.visibility || was.access.join() !== now.access.join()) {
    throw new SheetAccessError(
      "Only a person changes who can read a page. Keep the Sheet's visibility and access as they are.",
    )
  }
  if (before && was.visibility === 'public' && redactionWeight(after) < redactionWeight(before)) {
    throw new SheetAccessError(
      'This page is on a public link: keep every <Redact> and redact column it has.',
    )
  }
}

/** A page is on a public link exactly while its `<Sheet>` says `public`. */
export function syncShare(
  ws: Workspace,
  id: string,
  { visibility }: SheetAccess,
  by: string | null,
) {
  if (visibility === 'public') openShare(ws, id, by)
  else closeShare(ws, id)
}
