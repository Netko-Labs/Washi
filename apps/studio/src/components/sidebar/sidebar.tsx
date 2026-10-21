import { IconX } from '@tabler/icons-react'
import { AskField } from './ask-field'
import type { SidebarProps } from './lib'
import { SidebarPages } from './sidebar-pages'
import { SidebarPlaces } from './sidebar-places'
import { WorkspaceFooter } from './workspace-footer'

/** Sidebar D (D57): the ask field, the places row, Recents · Favorites · Pages · Routines, the workspace footer. A drawer under `md`. */
export function Sidebar({ workspace, open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close the sidebar"
          tabIndex={-1}
          onClick={onClose}
          className="fixed inset-0 z-40 cursor-default bg-black/30 md:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] shrink-0 flex-col border-border border-r bg-muted transition-transform md:static md:w-[248px] md:translate-x-0 md:transition-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex shrink-0 items-center gap-1 px-2 pt-2 pb-1.5">
          <div className="min-w-0 flex-1">
            <AskField onNavigate={onClose} />
          </div>
          <button
            type="button"
            aria-label="Close the sidebar"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent md:hidden"
          >
            <IconX className="size-[15px]" />
          </button>
        </div>
        <div className="shrink-0 px-2 pb-1">
          <SidebarPlaces workspaceId={workspace.id} onNavigate={onClose} />
        </div>
        <SidebarPages workspaceId={workspace.id} onNavigate={onClose} />
        <WorkspaceFooter workspace={workspace} onNavigate={onClose} />
      </aside>
    </>
  )
}
