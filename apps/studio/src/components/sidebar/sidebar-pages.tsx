import { IconPlus, IconTrash } from '@tabler/icons-react'
import { useFavoritesStore, useSheetsStore, useViewStore } from '@washi/ui'
import { pathFor } from '@/components/shell'
import { openInPlace, type SidebarSectionProps } from './lib'
import { SidebarPageRow } from './sidebar-page-row'
import { SidebarTree } from './sidebar-tree'

const HEADING =
  'px-2 pt-[18px] pb-1.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]'
const ROW =
  'flex h-9 w-full items-center gap-2 rounded-lg px-2 text-[13px] text-muted-foreground hover:bg-accent md:h-[29px]'

/** Favorites first, then the page tree, then the Trash. */
export function SidebarPages({ workspaceId, onNavigate }: SidebarSectionProps) {
  const sheets = useSheetsStore((state) => state.sheets)
  const favoriteIds = useFavoritesStore((state) => state.ids)
  const isTrashOpen = useViewStore((state) => state.activeTab === 'view:trash')
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
      <SidebarTree workspaceId={workspaceId} onNavigate={onNavigate} />
      <button
        type="button"
        onClick={() => {
          void useSheetsStore.getState().createSheet()
          onNavigate()
        }}
        className={ROW}
      >
        <IconPlus className="size-3.5" />
        New page
      </button>
      <a
        href={pathFor(workspaceId, 'view:trash')}
        onClick={(event) =>
          openInPlace(event, () => {
            useViewStore.getState().openTab('view:trash')
            onNavigate()
          })
        }
        className={`${ROW} ${isTrashOpen ? 'bg-accent font-medium text-foreground' : ''}`}
      >
        <IconTrash className="size-3.5" />
        Trash
      </a>
    </div>
  )
}
