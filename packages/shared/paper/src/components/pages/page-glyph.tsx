import type { PageGlyphProps } from '../../lib/types'
import { useSheetLook } from '../../look'

const PAGE = 'M7 3h7l5 5v13H7zM14 3v5h5'

/** A page's icon as the host draws it; an emoji as itself; no icon, a quiet page glyph. */
export function PageGlyph({ icon }: PageGlyphProps) {
  const { drawIcon } = useSheetLook()
  const drawn = icon && (/\p{Extended_Pictographic}/u.test(icon) ? icon : drawIcon?.(icon))
  return (
    <span className="wsx-page-glyph" aria-hidden>
      {drawn || (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d={PAGE} strokeLinejoin="round" />
        </svg>
      )}
    </span>
  )
}
