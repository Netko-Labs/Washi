import { useEffect, useRef } from 'react'
import { noteIdOf, useAgentStore, useSheetsStore, useViewStore } from '../../../stores'
import type { PanelFrame } from '../types'

/** What the panel needs besides the store: the subscriptions started, the transcript kept at its tail, the page's title. */
export function usePanelFrame(transcriptLength: number): PanelFrame {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeSheetTitle = useSheetsStore(
    (state) =>
      state.sheets.find((sheet) => sheet.id === noteIdOf(useViewStore.getState().activeTab))
        ?.title ?? null,
  )

  useEffect(() => {
    void useAgentStore.getState().init()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [transcriptLength])

  return { scrollRef, activeSheetTitle }
}
