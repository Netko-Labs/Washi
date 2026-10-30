import { useEffect, useState } from 'react'
import { noteIdOf, useAgentStore, useSheetsStore, useViewStore } from '../../../stores'
import { lingerUntil, pillStateFor } from '../utils'
import { useAgentMood } from './use-agent-mood'

/** The header's Washi chip for the page on screen, or null when Washi has nothing to do with it. */
export function useAgentPill() {
  const pageId = useViewStore((state) => noteIdOf(state.activeTab))
  const sheet = useSheetsStore((state) => state.sheets.find((each) => each.id === pageId))
  const mood = useAgentMood()
  const isBusy = useAgentStore((state) => state.running || state.approvals.length > 0)
  const [, rerender] = useState(0)

  const until = lingerUntil(sheet)
  useEffect(() => {
    const left = until - Date.now()
    if (left <= 0) return
    const timer = setTimeout(() => rerender((tick) => tick + 1), left)
    return () => clearTimeout(timer)
  }, [until])

  if (!pageId) return null
  return pillStateFor({ mood, isBusy, sheet, now: Date.now() })
}
