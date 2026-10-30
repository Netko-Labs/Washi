import { useEffect, useRef } from 'react'
import { type TurnState, useAgentStore } from '../../../stores'
import type { PanelFrame } from '../types'
import { NEAR_END_PX } from '../values'

/**
 * What the panel needs besides the store: the subscriptions started, the transcript kept at its
 * tail — on a new entry, a turn's end (Stopped, Retry) and a box shrunk by a keyboard or the
 * composer, unless the reader scrolled up.
 */
export function usePanelFrame(transcriptLength: number, turn: TurnState): PanelFrame {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isPinned = useRef(true)

  useEffect(() => {
    void useAgentStore.getState().init()
  }, [])

  useEffect(() => {
    isPinned.current = true
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [transcriptLength, turn])

  useEffect(() => {
    const box = scrollRef.current
    if (!box) return
    const onScroll = () => {
      isPinned.current = box.scrollHeight - box.scrollTop - box.clientHeight <= NEAR_END_PX
    }
    const observer = new ResizeObserver(() => {
      if (isPinned.current) box.scrollTop = box.scrollHeight
    })
    observer.observe(box)
    box.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      observer.disconnect()
      box.removeEventListener('scroll', onScroll)
    }
  }, [])

  return { scrollRef }
}
