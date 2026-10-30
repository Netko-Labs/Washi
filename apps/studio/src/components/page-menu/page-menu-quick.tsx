import {
  IconLink,
  IconMessageCircle,
  IconShare,
  IconStar,
  IconStarFilled,
} from '@tabler/icons-react'
import { useFavoritesStore } from '@washi/ui'
import { useCommentsStore } from '@/components/comments'
import { SHEET_ROW as ITEM } from '@/components/shared/bottom-sheet'
import type { PageMenuQuickProps } from './lib'

/** What a wide header shows beside ⋯, folded into it on a phone. */
export function PageMenuQuick({ sheet, onMode, onDone }: PageMenuQuickProps) {
  const isFavorite = useFavoritesStore((state) => state.ids.includes(sheet.id))
  const Star = isFavorite ? IconStarFilled : IconStar

  return (
    <>
      <button
        type="button"
        onClick={() => {
          useCommentsStore.getState().open(sheet.id)
          onDone()
        }}
        className={ITEM}
      >
        <IconMessageCircle className="size-4 text-muted-foreground" />
        Comments
      </button>
      <button type="button" onClick={() => onMode('share')} className={ITEM}>
        <IconShare className="size-4 text-muted-foreground" />
        Share…
      </button>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(window.location.href)
          onDone()
        }}
        className={ITEM}
      >
        <IconLink className="size-4 text-muted-foreground" />
        Copy link
      </button>
      <button
        type="button"
        aria-pressed={isFavorite}
        onClick={() => useFavoritesStore.getState().toggle(sheet.id)}
        className={ITEM}
      >
        <Star className={`size-4 ${isFavorite ? 'text-[#e2a33b]' : 'text-muted-foreground'}`} />
        {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      </button>
      <div className="my-1 h-px bg-border" />
    </>
  )
}
