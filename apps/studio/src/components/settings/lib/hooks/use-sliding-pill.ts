import { type RefObject, useLayoutEffect, useState } from 'react'

/** Where the highlight sits under the item named `activeKey` (`data-key`), kept in step on resize. */
export function useSlidingPill(row: RefObject<HTMLElement | null>, activeKey: string) {
  const [box, setBox] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const node = row.current
    if (!node) return
    const place = () => {
      const active = node.querySelector<HTMLElement>(`[data-key="${activeKey}"]`)
      setBox(active ? { left: active.offsetLeft, width: active.offsetWidth } : null)
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(node)
    return () => observer.disconnect()
  }, [row, activeKey])

  return box
}
