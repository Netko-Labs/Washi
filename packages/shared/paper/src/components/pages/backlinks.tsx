import { styled } from '../../lib'
import type { BacklinksProps } from '../../lib/types'
import { usePaperHost } from '../../provider'
import { useBacklinks } from './lib'
import { PageEntry } from './page-entry'

/** Every page that links here — by Ref, link, include or canvas node — that the reader can open. */
export function Backlinks({ of, empty, ...rest }: BacklinksProps) {
  const host = usePaperHost()
  const pages = useBacklinks(of)
  if (!pages) return null

  return (
    <div {...styled(rest, 'wsx-subpages')} data-layout="list">
      {pages.map((page) => (
        <PageEntry key={page.id} page={page} layout="list" onOpen={() => host.openSheet(page.id)} />
      ))}
      {pages.length === 0 && <p className="wsx-empty">{empty ?? 'No page links here yet.'}</p>}
    </div>
  )
}
