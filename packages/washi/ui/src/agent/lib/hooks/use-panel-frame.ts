import { useEffect, useRef } from 'react'
import { useAgentStore } from '../../../stores'
import type { PanelFrame } from '../types'

/** What the panel needs besides the store: the subscriptions started, the transcript kept at its tail. */
export function usePanelFrame(transcriptLength: number): PanelFrame {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void useAgentStore.getState().init()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [transcriptLength])

  return { scrollRef }
}
