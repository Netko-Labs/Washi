import { IconPlus } from '@tabler/icons-react'
import { byRecent, useFavoritesStore, useSheetsStore } from '@washi/ui'
import type { SidebarSectionProps } from './lib'
import { SidebarPageRow } from './sidebar-page-row'

const HEADING =
  'px-2 pt-[18px] pb-1.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]'

/** Favorites first, then every page with the most recently edited on top. */
export function SidebarPages({ workspaceId, onNavigate }: SidebarSectionProps) {
  const sheets = useSheetsStore((state) => state.sheets)
  const favoriteIds = useFavoritesStore((state) => state.ids)
  const favorites = sheets.filter((sheet) => favoriteIds.includes(sheet.id))

  return (
    <div className="min-h-0 flex-1 space-y-px overflow-y-auto px-2 pb-2">
      {favorites.length > 0 && (
        <>
          <div className={HEADING}>Favorites</div>
          {favorites.map((sheet) => (
            <SidebarPageRow
              key={sheet.id}
              sheet={sheet}
              workspaceId={workspaceId}
              onNavigate={onNavigate}
            />
          ))}
        </>
      )}
      <div className={HEADING}>Pages</div>
      {sheets.length === 0 && (
        <p className="px-2 py-1 text-[12.5px] text-muted-foreground leading-relaxed">
          No pages yet. Ask Washi for one — there is nothing to type into here.
        </p>
      )}
      {byRecent(sheets).map((sheet) => (
        <SidebarPageRow
          key={sheet.id}
          sheet={sheet}
          workspaceId={workspaceId}
          onNavigate={onNavigate}
        />
      ))}
      <button
        type="button"
        onClick={() => {
          void useSheetsStore.getState().createSheet()
          onNavigate()
        }}
        className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-[13px] text-muted-foreground hover:bg-accent md:h-[29px]"
      >
        <IconPlus className="size-3.5" />
        New page
      </button>
    </div>
  )
}
