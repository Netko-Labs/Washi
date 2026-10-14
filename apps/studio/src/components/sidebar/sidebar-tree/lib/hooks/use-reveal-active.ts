import { ancestorsOf, noteIdOf, useSheetsStore, useViewStore } from '@washi/ui'
import { useEffect } from 'react'
import { useTreeStore } from '../tree-store'

/** The open page is never folded away: its parents open with it. */
export function useRevealActive() {
  const activeId = useViewStore((state) => noteIdOf(state.activeTab))
  const sheets = useSheetsStore((state) => state.sheets)

  useEffect(() => {
    if (!activeId) return
    useTreeStore.getState().expand(ancestorsOf(sheets, activeId).map((sheet) => sheet.id))
  }, [activeId, sheets])
}
