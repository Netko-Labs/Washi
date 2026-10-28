import { coverStyle } from '../lib'
import type { SheetCoverProps, SheetMarkProps } from '../lib/types'
import { useSheetLook } from '../look'
import { COVER_PICTURES } from '../registry/looks'

/** The page's cover, full bleed above its column. A picture names itself; Washi shipped it. */
export function SheetCover({ cover }: SheetCoverProps) {
  const look = useSheetLook()
  const edit = look.edit
  const picture = cover.startsWith('picture:')
    ? COVER_PICTURES.find((entry) => entry.slug === cover.slice('picture:'.length))
    : undefined

  return (
    <div className="wsx-cover" style={coverStyle(cover, look)}>
      {picture && look.pictureUrl && (
        <span className="wsx-cover-caption">{picture.label} · one of Washi's pictures</span>
      )}
      {edit && (
        <button
          type="button"
          className="wsx-cover-change"
          onClick={(event) => edit('cover', event.currentTarget)}
        >
          Change cover
        </button>
      )}
    </div>
  )
}

/** The page's icon: an emoji as text, a registry name or an upload as the host draws them. */
export function SheetMark({ icon, overCover }: SheetMarkProps) {
  const look = useSheetLook()
  const edit = look.edit
  const drawn = /\p{Extended_Pictographic}/u.test(icon) ? icon : look.drawIcon?.(icon)
  if (!drawn) return null

  return edit ? (
    <button
      type="button"
      aria-label="Change the icon"
      className="wsx-sheet-mark"
      data-over-cover={overCover || undefined}
      onClick={(event) => edit('icon', event.currentTarget)}
    >
      {drawn}
    </button>
  ) : (
    <span className="wsx-sheet-mark" data-over-cover={overCover || undefined}>
      {drawn}
    </span>
  )
}
