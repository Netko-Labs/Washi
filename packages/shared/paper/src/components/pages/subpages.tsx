import { styled } from '../../lib'
import type { SubpagesProps } from '../../lib/types'
import { usePaperHost } from '../../provider'
import { useSubpages } from './lib'
import { PageEntry } from './page-entry'

/** Every page under this one, in the sidebar's order: a hub that keeps itself current. */
export function Subpages({ of, layout = 'list', empty, ...rest }: SubpagesProps) {
  const host = usePaperHost()
  const pages = useSubpages(of)
  const parent = of ?? host.pageId
  if (!pages) return null

  return (
    <div {...styled(rest, 'wsx-subpages')} data-layout={layout}>
      {pages.map((page) => (
        <PageEntry
          key={page.id}
          page={page}
          layout={layout}
          onOpen={() => host.openSheet(page.id)}
        />
      ))}
      {pages.length === 0 && !host.newPage && (
        <p className="wsx-empty">{empty ?? 'Nothing under this page yet.'}</p>
      )}
      {host.newPage && parent && (
        <button
          type="button"
          className="wsx-page-entry wsx-page-new"
          data-layout={layout}
          onClick={() => void host.newPage?.(parent)}
        >
          + New page
        </button>
      )}
    </div>
  )
}
