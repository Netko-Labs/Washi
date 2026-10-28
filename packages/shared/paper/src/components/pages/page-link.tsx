import { useEffect, useState } from 'react'
import { styled } from '../../lib'
import type { PageCard, PageLinkProps } from '../../lib/types'
import { usePaperHost } from '../../provider'
import { PageEntry } from './page-entry'

/** Notion's link to a page: its icon and title as a block; a page the reader cannot open stays quiet. */
export function PageLink({ sheet, ...rest }: PageLinkProps) {
  const host = usePaperHost()
  // undefined while it loads, null when the reader cannot open it
  const [page, setPage] = useState<PageCard | null>()
  useEffect(() => {
    let alive = true
    host
      .resolveSheet(sheet)
      .then((found) => alive && setPage(found ? { id: sheet, cover: null, ...found } : null))
      .catch(() => alive && setPage(null))
    return () => {
      alive = false
    }
  }, [host, sheet])

  return (
    <div {...styled(rest, 'wsx-page-link')}>
      {page && <PageEntry page={page} layout="list" onOpen={() => host.openSheet(sheet)} />}
      {page === null && (
        <span className="wsx-page-entry" data-layout="list" data-missing>
          A page you cannot open
        </span>
      )}
    </div>
  )
}
