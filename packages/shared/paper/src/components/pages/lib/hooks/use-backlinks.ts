import { useEffect, useState } from 'react'
import type { PageCard } from '../../../../lib/types'
import { usePaperHost } from '../../../../provider'

/** Pages that link to `of` (or the page being drawn); null when the host keeps no index. */
export function useBacklinks(of?: string): PageCard[] | null {
  const host = usePaperHost()
  const target = of ?? host.pageId
  const [pages, setPages] = useState<PageCard[] | null>(null)
  useEffect(() => {
    if (!target || !host.backlinks) return
    let alive = true
    const read = () =>
      host
        .backlinks?.(target)
        .then((found) => alive && setPages(found))
        .catch(() => alive && setPages([]))
    void read()
    const stop = host.onPagesChange?.(() => void read())
    return () => {
      alive = false
      stop?.()
    }
  }, [host, target])
  return pages
}
