import { noteIdOf, useSheetsStore, useViewStore } from '@washi/ui'
import { useEffect, useState } from 'react'
import type { RecentEntry, RecentSheet } from '../types'
import { pushRecent, readRecents, relativeAge, writeRecents } from '../utils'

/** The last pages opened here, newest first — a page that was trashed drops out. */
export function useRecents(workspaceId: string): RecentSheet[] {
  const [recents, setRecents] = useState<RecentEntry[]>(() => readRecents(workspaceId))
  const sheets = useSheetsStore((state) => state.sheets)

  useEffect(() => {
    setRecents(readRecents(workspaceId))
    return useViewStore.subscribe((state, previous) => {
      const id = noteIdOf(state.activeTab)
      if (!id || state.activeTab === previous.activeTab) return
      setRecents((current) => {
        const next = pushRecent(current, id, Date.now())
        writeRecents(workspaceId, next)
        return next
      })
    })
  }, [workspaceId])

  const now = Date.now()
  return recents.flatMap((entry) => {
    const sheet = sheets.find((candidate) => candidate.id === entry.id)
    return sheet ? [{ sheet, age: relativeAge(entry.at, now) }] : []
  })
}
