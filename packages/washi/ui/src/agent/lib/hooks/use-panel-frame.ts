import { useEffect, useRef } from 'react'
import { useAgentStore } from '../../../stores'
import type { PanelFrame, PanelSignal } from '../types'
import { followsEnd, isAtEnd } from '../utils'

/**
 * What the panel needs besides the store: the subscriptions started, the transcript kept at its
 * tail — on a new entry, a turn's end (Stopped, Retry) and a box shrunk by a keyboard or the
 * composer — while the reader is there; a reader scrolled up stays put.
 */
export function usePanelFrame({ length, turn, sessionId, isOwnLast }: PanelSignal): PanelFrame {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isPinned = useRef(true)
  const shownSession = useRef(sessionId)
  const shownLength = useRef(0)

  useEffect(() => {
    void useAgentStore.getState().init()
  }, [])

  useEffect(() => {
    const isNewChat = sessionId !== shownSession.current
    const change = {
      isPinned: isPinned.current,
      isNewChat,
      isOwnLast,
      length,
      shownLength: shownLength.current,
    }
    shownSession.current = sessionId
    shownLength.current = length
    if (!followsEnd(change)) return
    isPinned.current = true
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [length, turn, sessionId, isOwnLast])

  useEffect(() => {
    const box = scrollRef.current
    if (!box) return
    const onScroll = () => {
      isPinned.current = isAtEnd(box)
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
