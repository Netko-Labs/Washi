import { useEffect, useRef, useState } from 'react'
import type { StickToBottom } from '../types'
import { isNearBottom } from '../utils'

/**
 * Follows the end while the reader is there — also when the column grows after a render or the
 * box shrinks under a keyboard or a taller composer; scrolled up, it stays put and says something
 * new arrived. `force` is the person's own send, which always follows.
 */
export function useStickToBottom(signal: unknown, force: boolean): StickToBottom {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isPinned = useRef(true)
  const [hasNew, setNew] = useState(false)

  useEffect(() => {
    const box = scrollRef.current
    if (!box) return
    if (force) isPinned.current = true
    if (isPinned.current) {
      box.scrollTop = box.scrollHeight
      setNew(false)
    } else setNew(true)
  }, [signal, force])

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
