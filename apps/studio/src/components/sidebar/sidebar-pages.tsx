import { IconPlus, IconTrash } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useFavoritesStore, useSheetsStore, useViewStore } from '@washi/ui'
import { pathFor } from '@/components/shell'
import { LABEL, openInPlace, ROW, ROW_ON, type SidebarSectionProps } from './lib'
import { SidebarPageRow } from './sidebar-page-row'
import { SidebarRecents } from './sidebar-recents'
import { SidebarTree } from './sidebar-tree'

/** Recents, Favorites, the page tree with its action, Routines with its action, then the Trash. */
export function SidebarPages({ workspaceId, onNavigate }: SidebarSectionProps) {
  const sheets = useSheetsStore((state) => state.sheets)
  const favoriteIds = useFavoritesStore((state) => state.ids)
  const isTrashOpen = useViewStore((state) => state.activeTab === 'view:trash')
  const favorites = sheets.filter((sheet) => favoriteIds.includes(sheet.id))

  return (
    <div className="min-h-0 flex-1 space-y-px overflow-y-auto px-3 pb-2 md:px-2">
      <SidebarRecents workspaceId={workspaceId} onNavigate={onNavigate} />
      {favorites.length > 0 && (
        <>
          <div className={LABEL}>Favorites</div>
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
      <div className={LABEL}>Pages</div>
      {sheets.length === 0 && (
        <p className="px-2 py-1 text-[14px] text-muted-foreground leading-relaxed md:text-[12.5px]">
          No pages yet. Start one, or ask Washi to.
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
        <IconPlus className="size-3.5 opacity-70" />
        New page
      </button>
      <div className={LABEL}>Routines</div>
      <Link
        to="/w/$workspaceId/settings"
        params={{ workspaceId }}
        search={{ tab: 'routines' }}
        onClick={onNavigate}
        className={ROW}
      >
        <IconPlus className="size-3.5 opacity-70" />
        Schedule one
      </Link>
      <a
        href={pathFor(workspaceId, 'view:trash')}
        onClick={(event) =>
          openInPlace(event, () => {
            useViewStore.getState().openTab('view:trash')
            onNavigate()
          })
        }
        className={`${ROW} mt-1.5 ${isTrashOpen ? ROW_ON : 'opacity-70'}`}
      >
        <IconTrash className="size-3.5" />
        Trash
      </a>
    </div>
  )
}
