import { useEffect, useRef, useState } from 'react'
import type { ScrollEdges } from '../types'
import { edgesOf } from '../utils'
import { NO_EDGES } from '../values'

/**
 * Which ends of a sideways strip hide something, kept in step on scroll and resize. The item
 * named `activeKey` (`data-key`) is scrolled into view, so a section past the edge still shows.
 */
export function useScrollEdges<T extends HTMLElement>(activeKey: string) {
  const strip = useRef<T>(null)
  const [edges, setEdges] = useState<ScrollEdges>(NO_EDGES)

  useEffect(() => {
    const node = strip.current
    if (!node) return
    const read = () => {
      const next = edgesOf(node)
      setEdges((prev) => (prev.start === next.start && prev.end === next.end ? prev : next))
    }
    node
      .querySelector(`[data-key="${activeKey}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    read()
    node.addEventListener('scroll', read, { passive: true })
    const observer = new ResizeObserver(read)
    observer.observe(node)
    return () => {
      node.removeEventListener('scroll', read)
      observer.disconnect()
    }
  }, [activeKey])

  return { strip, edges }
}
