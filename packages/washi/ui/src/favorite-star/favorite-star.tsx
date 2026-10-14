import { IconStar, IconStarFilled } from '@tabler/icons-react'
import { useFavoritesStore } from '../stores'
import type { FavoriteStarProps } from './types'

export function FavoriteStar({ sheetId }: FavoriteStarProps) {
  const favorite = useFavoritesStore((state) => state.ids.includes(sheetId))
  return (
    <button
      type="button"
      aria-pressed={favorite}
      aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
      title={favorite ? 'Remove from favorites' : 'Add to favorites'}
      onClick={() => useFavoritesStore.getState().toggle(sheetId)}
      className="grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {favorite ? (
        <IconStarFilled className="size-[15px] text-[#e2a33b]" />
      ) : (
        <IconStar className="size-[15px]" />
      )}
    </button>
  )
}
