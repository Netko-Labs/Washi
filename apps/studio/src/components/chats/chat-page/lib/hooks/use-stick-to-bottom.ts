import { useEffect, useRef, useState } from 'react'
import type { StickToBottom } from '../types'
import { isFreshSend, isNearBottom } from '../utils'

/**
 * Follows the end while the reader is there — also when the column grows after a render or the
 * box shrinks under a keyboard or a taller composer; scrolled up, it stays put and says something
 * new arrived. The person's own send follows once, as it lands.
 */
export function useStickToBottom(
  signal: unknown,
  length: number,
  isOwnLast: boolean,
): StickToBottom {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isPinned = useRef(true)
  const shownLength = useRef(0)
  const [hasNew, setNew] = useState(false)

  useEffect(() => {
    const box = scrollRef.current
    if (!box) return
    if (isFreshSend(isOwnLast, length, shownLength.current)) isPinned.current = true
    shownLength.current = length
    if (isPinned.current) {
      box.scrollTop = box.scrollHeight
      setNew(false)
    } else setNew(true)
  }, [signal, length, isOwnLast])

  useEffect(() => {
    const box = scrollRef.current
    if (!box) return
    const follow = () => {
      if (isPinned.current) box.scrollTop = box.scrollHeight
    }
    const observer = new ResizeObserver(follow)
    observer.observe(box)
    for (const child of box.children) observer.observe(child)
    return () => observer.disconnect()
  }, [])

  return {
    scrollRef,
    hasNew,
    onScroll: () => {
      const box = scrollRef.current
      if (!box) return
      isPinned.current = isNearBottom(box)
      if (isPinned.current) setNew(false)
    },
    jump: () => {
      const box = scrollRef.current
      if (!box) return
      isPinned.current = true
      setNew(false)
      box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' })
    },
  }
}
