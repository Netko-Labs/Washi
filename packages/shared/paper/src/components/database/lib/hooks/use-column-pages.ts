import { useEffect, useState } from 'react'
import { usePaperHost } from '../../../../provider'

/** Titles of the pages whose views name this column; none until the host answers, or ever. */
export function useColumnPages(table: string, column: string): string[] {
  const host = usePaperHost()
  const [pages, setPages] = useState<string[]>([])

  useEffect(() => {
    let live = true
    host
      .columnPages?.(table, column)
      .then((titles) => {
        if (live) setPages(titles)
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [host, table, column])

  return pages
}
