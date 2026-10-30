import { groupByParent, noteIdOf, useSheetsStore, useViewStore } from '@washi/ui'
import { type KeyboardEvent, useMemo } from 'react'
import { useTreeStore } from '../tree-store'
import { isMenuKey, tabStopOf, treeMove, visibleRows } from '../utils'
import { useRevealActive } from './use-reveal-active'

/**
 * The tree is one Tab stop and walks by arrows. Enter opens the row's page; the context-menu key
 * (or Shift+F10) opens its options, where Add a page inside and Move to Trash live.
 */
export function useTreeNav() {
  const sheets = useSheetsStore((state) => state.sheets)
  const expanded = useTreeStore((state) => state.expanded)
  const current = useTreeStore((state) => state.current)
  const activeId = useViewStore((state) => noteIdOf(state.activeTab))
  useRevealActive()
  const groups = useMemo(() => groupByParent(sheets), [sheets])
  const rows = useMemo(() => visibleRows(groups, expanded), [groups, expanded])

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!(event.target instanceof HTMLElement)) return
    const item = event.target.closest<HTMLElement>('[role="treeitem"]')
    const id = item?.dataset.treeId
    if (!item || !id) return
    if (event.target === item && (event.key === 'Enter' || isMenuKey(event))) {
      event.preventDefault()
      item.querySelector<HTMLElement>(event.key === 'Enter' ? 'a' : '[aria-haspopup]')?.click()
      return
    }
    const move = treeMove(rows, id, event.key)
    if (!move) return
    event.preventDefault()
    if (move.kind === 'toggle') useTreeStore.getState().toggle(move.id)
    else event.currentTarget.querySelector<HTMLElement>(`[data-tree-id="${move.id}"]`)?.focus()
  }

  return { groups, tabStop: tabStopOf(rows, current, activeId), onKeyDown }
}
