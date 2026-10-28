import { coverStyle } from '../../lib'
import type { PageEntryProps } from '../../lib/types'
import { useSheetLook } from '../../look'
import { PageGlyph } from './page-glyph'

/** One page as a list line, a card, or a gallery card wearing its cover. */
export function PageEntry({ page, layout, onOpen }: PageEntryProps) {
  const look = useSheetLook()
  const cover = page.cover ? coverStyle(page.cover, look) : {}
  const isBare = Object.keys(cover).length === 0
  return (
    <button type="button" className="wsx-page-entry" data-layout={layout} onClick={onOpen}>
      {layout === 'gallery' && (
        <span
          className="wsx-page-entry-cover"
          data-empty={isBare || undefined}
          style={isBare ? undefined : cover}
        />
      )}
      <span className="wsx-page-entry-name">
        <PageGlyph icon={page.icon} />
        <span className="wsx-page-entry-title">{page.title || 'Untitled'}</span>
      </span>
    </button>
  )
}
