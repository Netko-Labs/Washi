import { useEffect, useState } from 'react'
import { SPY_MARGIN } from '../values'

/** The first of `ids` (in their order) whose element is in the reading band, kept while none is. */
export function useActiveAnchor(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null)
  const key = ids.join(' ')

  useEffect(() => {
    const order = key.split(' ')
    const inBand = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inBand.add(entry.target.id)
          else inBand.delete(entry.target.id)
        }
        const first = order.find((id) => inBand.has(id))
        if (first) setActive(first)
      },
      { rootMargin: SPY_MARGIN },
    )
    for (const id of order) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [key])

  return active
}
