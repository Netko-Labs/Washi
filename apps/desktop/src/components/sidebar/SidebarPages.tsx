import { IconPlus } from '@tabler/icons-react'
import { byRecent, useFavoritesStore, useSheetsStore } from '@washi/ui'
import { SidebarPageRow } from './SidebarPageRow'

const HEADING =
  'px-2 pt-[18px] pb-1.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]'

/** Favorites first, then every page with the most recently edited on top. */
export function SidebarPages() {
  const sheets = useSheetsStore((state) => state.sheets)
  const favoriteIds = useFavoritesStore((state) => state.ids)
  const favorites = sheets.filter((sheet) => favoriteIds.includes(sheet.id))

  return (
    <div className="flex-1 space-y-px overflow-y-auto px-2 pb-2">
      {favorites.length > 0 && (
        <>
          <div className={HEADING}>Favorites</div>
          {favorites.map((sheet) => (
            <SidebarPageRow key={sheet.id} sheet={sheet} />
          ))}
        </>
      )}
      <div className={HEADING}>Pages</div>
      {byRecent(sheets).map((sheet) => (
        <SidebarPageRow key={sheet.id} sheet={sheet} />
      ))}
      <button
        type="button"
        aria-label="New sheet"
        onClick={() => void useSheetsStore.getState().createSheet()}
        className="flex h-[29px] w-full items-center gap-2 rounded-lg px-2 text-[13px] text-muted-foreground hover:bg-accent"
      >
        <IconPlus className="size-3.5" />
        New page
      </button>
    </div>
  )
}
