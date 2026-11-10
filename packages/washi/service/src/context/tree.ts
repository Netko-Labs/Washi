import type { SheetSummary } from '@washi/domain'
import type { RenderContext } from './types'

const byPosition = (a: SheetSummary, b: SheetSummary) =>
  a.position < b.position ? -1 : a.position > b.position ? 1 : 0

/**
 * The tree the reader may read, row pages left out (they belong to their table): each page's
 * children in order, and the tops — pages with no parent, or a parent the reader cannot open.
 */
export function treeOf(pages: SheetSummary[]) {
  const listed = pages.filter((page) => !page.rowOf).sort(byPosition)
  const ids = new Set(listed.map((page) => page.id))
  const byId = new Map(listed.map((page) => [page.id, page]))
  const children = new Map<string, string[]>()
  const tops: string[] = []
  for (const page of listed) {
    if (page.parentId && ids.has(page.parentId)) {
      children.set(page.parentId, [...(children.get(page.parentId) ?? []), page.id])
    } else tops.push(page.id)
  }
  return { byId, children, tops }
}

/** Pages in tree order from the given starts, each with its depth, down to `depth` levels. */
export function walkTree(
  starts: string[],
  children: Map<string, string[]>,
  depth = Number.POSITIVE_INFINITY,
): { id: string; depth: number }[] {
  const out: { id: string; depth: number }[] = []
  const visit = (id: string, level: number) => {
    out.push({ id, depth: level })
    if (level >= depth) return
    for (const child of children.get(id) ?? []) visit(child, level + 1)
  }
  for (const start of starts) visit(start, 0)
  return out
}

/** What a page's renderer needs to name other pages. */
export function renderContextOf(tree: ReturnType<typeof treeOf>, pageId: string): RenderContext {
  return {
    titles: new Map([...tree.byId].map(([id, page]) => [id, page.title])),
    children: tree.children,
    pageId,
  }
}
