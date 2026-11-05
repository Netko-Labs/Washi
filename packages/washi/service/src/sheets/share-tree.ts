import type { SheetDetail, SheetSummary } from '@washi/domain'
import { getSheet, listSheets, type Workspace } from '@washi/repository'
import { parse, type WsxElement } from '@washi/wsx'
import { SHARED_TREE_CAP } from './constants'
import type { SharedTreePage } from './types'

/** Whether a page's link opens its sub-pages too (D123): the person's switch on its `<Sheet>`. */
export const sharesSubpages = (root: WsxElement) => root.props.subpages === true

const byPosition = (a: SheetSummary, b: SheetSummary) =>
  a.position < b.position ? -1 : a.position > b.position ? 1 : 0

/**
 * The pages a link opens beside its own, in tree order: every live descendant of `home` the world
 * may read — a private page, and everything under it, stays out — up to `SHARED_TREE_CAP`. Empty
 * unless the home page shares its sub-pages.
 */
export function sharedTree(
  ws: Workspace,
  home: SheetDetail,
  homeRoot: WsxElement,
  world: Set<string>,
): SharedTreePage[] {
  if (!sharesSubpages(homeRoot)) return []
  const children = new Map<string, SheetSummary[]>()
  for (const page of listSheets(ws)) {
    if (!page.parentId || page.rowOf || !world.has(page.id)) continue
    children.set(page.parentId, [...(children.get(page.parentId) ?? []), page])
  }
  const out: SharedTreePage[] = []
  const walk = (parentId: string, depth: number) => {
    for (const page of (children.get(parentId) ?? []).sort(byPosition)) {
      if (out.length >= SHARED_TREE_CAP || depth > 32) return
      out.push({
        id: page.id,
        parentId,
        title: page.title,
        icon: page.icon,
        cover: page.cover,
      })
      walk(page.id, depth + 1)
    }
  }
  walk(home.id, 0)
  return out
}

/**
 * Whether a person's page is on a public link at all: public itself, or under a public page that
 * shares its sub-pages with nothing private between them. Washi treats both alike (A2).
 */
export function onPublicLink(ws: Workspace, id: string, world: Set<string>): boolean {
  if (!world.has(id)) return false
  let at = getSheet(ws, id)
  for (let depth = 0; at && depth < 64; depth++) {
    if (at.visibility === 'public' && (at.id === id || sharesSubpages(parse(at.source)))) {
      return true
    }
    at = at.parentId ? getSheet(ws, at.parentId) : null
  }
  return false
}
