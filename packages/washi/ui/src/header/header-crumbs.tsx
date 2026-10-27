import { FavoriteStar } from '../favorite-star'
import { relativeTime } from '../page-time'
import { ancestorsOf } from '../page-tree'
import { noteIdOf, useSheetsStore, useViewStore, viewOf } from '../stores'
import { type HeaderCrumbsProps, MAX_CRUMBS, VIEW_LABELS } from './lib'

const SLASH = <span className="text-muted-foreground opacity-50">/</span>

/** Workspace / … / parent / page — every page above this one is a step back up. */
export function HeaderCrumbs({ starInActions }: HeaderCrumbsProps) {
  const sheets = useSheetsStore((state) => state.sheets)
  const activeTab = useViewStore((state) => state.activeTab)
  const workspaceName = useViewStore((state) => state.workspaceName)

  const view = viewOf(activeTab)
  const active = sheets.find((sheet) => sheet.id === noteIdOf(activeTab))
  const ancestors = active ? ancestorsOf(sheets, active.id) : []
  const shown = ancestors.slice(-MAX_CRUMBS)
  const leaf =
    view === 'note' ? (active ? active.title : 'All pages') : (VIEW_LABELS[view] ?? 'Washi')

  return (
    <>
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
        <span className="hidden shrink-0 items-center gap-1.5 @xl:flex">
          <span className="text-muted-foreground">{workspaceName}</span>
          {SLASH}
        </span>
        {shown.length < ancestors.length && (
          <>
            <span className="text-muted-foreground">…</span>
            {SLASH}
          </>
        )}
        {shown.map((sheet) => (
          <span key={sheet.id} className="flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => useViewStore.getState().openTab(`note:${sheet.id}`)}
              className="max-w-[140px] truncate rounded px-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {sheet.title}
            </button>
            {SLASH}
          </span>
        ))}
        <span className="truncate font-medium">{leaf}</span>
        {view === 'note' && active && (
          <span className="hidden shrink-0 text-muted-foreground @3xl:inline">
            · edited {relativeTime(active.hlcUpdated)}
          </span>
        )}
      </nav>
      {view === 'note' && active && !starInActions && <FavoriteStar sheetId={active.id} />}
    </>
  )
}
