import type { SheetSummary } from '@washi/domain'
import type { PageDrop } from '@washi/ui'
import type { DragEvent, KeyboardEvent } from 'react'
import { EDGE_RATIO } from './constants'
import type { TreeMove, TreeRow } from './types'

export function dropZone(event: DragEvent<HTMLElement>): PageDrop {
  const rect = event.currentTarget.getBoundingClientRect()
  const ratio = (event.clientY - rect.top) / rect.height
  if (ratio < EDGE_RATIO) return 'before'
  if (ratio > 1 - EDGE_RATIO) return 'after'
  return 'inside'
}

export function visibleRows(
  groups: Map<string | null, SheetSummary[]>,
  expanded: string[],
  parentId: string | null = null,
): TreeRow[] {
  return (groups.get(parentId) ?? []).flatMap((sheet) => {
    const hasChildren = (groups.get(sheet.id)?.length ?? 0) > 0
    const isExpanded = hasChildren && expanded.includes(sheet.id)
    const row = { id: sheet.id, parentId, hasChildren, isExpanded }
    return isExpanded ? [row, ...visibleRows(groups, expanded, sheet.id)] : [row]
  })
}

/** The last row focused, else the open page, else the first: one row is always Tab's. */
export function tabStopOf(
  rows: TreeRow[],
  current: string | null,
  activeId: string | null,
): string | null {
  const drawn = (id: string | null) => id !== null && rows.some((row) => row.id === id)
  if (drawn(current)) return current
  if (drawn(activeId)) return activeId
  return rows[0]?.id ?? null
}

/** WAI-ARIA tree keys: ↑ ↓ Home End walk the drawn rows; → opens then enters, ← closes then climbs. */
export function treeMove(rows: TreeRow[], id: string, key: string): TreeMove | null {
  const index = rows.findIndex((row) => row.id === id)
  const row = rows[index]
  if (!row) return null
  if (key === 'ArrowRight') {
    if (!row.hasChildren) return null
    const child = rows[index + 1]
    if (!row.isExpanded) return { kind: 'toggle', id }
    return child ? { kind: 'focus', id: child.id } : null
  }
  if (key === 'ArrowLeft') {
    if (row.isExpanded) return { kind: 'toggle', id }
    return row.parentId ? { kind: 'focus', id: row.parentId } : null
  }
  const steps: Record<string, number> = {
    ArrowDown: index + 1,
    ArrowUp: index - 1,
    Home: 0,
    End: rows.length - 1,
  }
  const next = rows[steps[key] ?? -1]
  return next ? { kind: 'focus', id: next.id } : null
}

/** The keys that open a context menu where there is no right click: ≣ and Shift+F10. */
export function isMenuKey(event: KeyboardEvent): boolean {
  return event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')
}
