import { positionBetween, type SheetSummary } from '@washi/domain'
import type { PageDrop, PagePlacement } from './types'

function byPosition(a: SheetSummary, b: SheetSummary): number {
  if (a.position !== b.position) return a.position < b.position ? -1 : 1
  return a.id < b.id ? -1 : 1
}

/** A row's page lives in its database, not the tree. */
const inTree = (sheet: SheetSummary) => sheet.rowOf === null

export function childrenOf(sheets: SheetSummary[], parentId: string | null): SheetSummary[] {
  return sheets.filter((sheet) => inTree(sheet) && sheet.parentId === parentId).sort(byPosition)
}

/** Every page's children, ordered, keyed by parent id (`null` is the top level). */
export function groupByParent(sheets: SheetSummary[]): Map<string | null, SheetSummary[]> {
  const groups = new Map<string | null, SheetSummary[]>()
  for (const sheet of sheets.filter(inTree).sort(byPosition)) {
    const siblings = groups.get(sheet.parentId) ?? []
    siblings.push(sheet)
    groups.set(sheet.parentId, siblings)
  }
  return groups
}

/** The pages above `id`, top level first; a parent missing from the list ends the walk. */
export function ancestorsOf(sheets: SheetSummary[], id: string): SheetSummary[] {
  const byId = new Map(sheets.map((sheet) => [sheet.id, sheet]))
  const chain: SheetSummary[] = []
  let parentId = byId.get(id)?.parentId ?? null
  while (parentId && !chain.some((sheet) => sheet.id === parentId)) {
    const parent = byId.get(parentId)
    if (!parent) break
    chain.unshift(parent)
    parentId = parent.parentId
  }
  return chain
}

/** True when `candidateId` is `id` itself or somewhere beneath it. */
export function isWithin(sheets: SheetSummary[], id: string, candidateId: string): boolean {
  return candidateId === id || ancestorsOf(sheets, candidateId).some((sheet) => sheet.id === id)
}

/** Where a drop puts the dragged page, or null when the drop would put it inside itself. */
export function placementFor(
  sheets: SheetSummary[],
  draggedId: string,
  targetId: string,
  drop: PageDrop,
): PagePlacement | null {
  const target = sheets.find((sheet) => sheet.id === targetId)
  if (!target || draggedId === targetId) return null
  if (drop === 'inside') {
    if (isWithin(sheets, draggedId, target.id)) return null
    const children = childrenOf(sheets, target.id).filter((sheet) => sheet.id !== draggedId)
    return { parentId: target.id, index: children.length }
  }
  const { parentId } = target
  if (parentId && isWithin(sheets, draggedId, parentId)) return null
  const siblings = childrenOf(sheets, parentId).filter((sheet) => sheet.id !== draggedId)
  const at = siblings.findIndex((sheet) => sheet.id === target.id)
  return { parentId, index: drop === 'before' ? at : at + 1 }
}

/** The list as it will look once the server has the move — the same key it will compute. */
export function applyPlacement(
  sheets: SheetSummary[],
  id: string,
  { parentId, index }: PagePlacement,
): SheetSummary[] {
  const siblings = childrenOf(sheets, parentId).filter((sheet) => sheet.id !== id)
  const at = Math.max(0, Math.min(index, siblings.length))
  const position = positionBetween(
    siblings[at - 1]?.position ?? null,
    siblings[at]?.position ?? null,
  )
  return sheets.map((sheet) => (sheet.id === id ? { ...sheet, parentId, position } : sheet))
}
