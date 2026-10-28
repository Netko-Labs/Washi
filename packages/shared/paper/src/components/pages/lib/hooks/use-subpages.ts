import { useEffect, useState } from 'react'
import type { PageCard } from '../../../../lib/types'
import { usePaperHost } from '../../../../provider'

/** The children of `of` (or the page being drawn), refreshed when the tree moves; null without a tree. */
export function useSubpages(of?: string): PageCard[] | null {
  const host = usePaperHost()
  const parent = of ?? host.pageId
  const read = () => (parent && host.listPages ? host.listPages(parent) : null)
  const [pages, setPages] = useState(read)
  useEffect(() => {
    setPages(read())
    return host.onPagesChange?.(() => setPages(read()))
  }, [host, parent])
  return pages
}
