import { IconLayoutSidebarLeftCollapse, IconX } from '@tabler/icons-react'
import { AskField } from './ask-field'
import type { SidebarProps } from './lib'
import { SidebarPages } from './sidebar-pages'
import { SidebarPlaces } from './sidebar-places'
import { WorkspaceFooter } from './workspace-footer'

/** Sidebar D (D57) from `md` up: the ask field, the places row, Recents · Favorites · Pages · Routines, the workspace footer. Folds to nothing (D59). */
export function Sidebar({ workspace, folded, peeking, onFold, onPeekEnd, drawer }: SidebarProps) {
  const shown = !folded || peeking || drawer
  // Folded, it stays out of the flow and only slides, so a peek never reflows the page.
  const frame = drawer
    ? 'h-full w-full border-r-0 bg-background'
    : peeking
      ? 'fixed inset-y-0 left-0 w-[248px] shadow-[0_16px_48px_rgb(0_0_0/0.18)]'
      : folded
        ? 'fixed inset-y-0 left-0 w-[248px] -translate-x-full'
        : 'w-[248px]'

  return (
    <aside
      inert={!shown}
      onPointerLeave={peeking ? onPeekEnd : undefined}
      className={`group/side z-40 flex shrink-0 flex-col overflow-hidden border-border border-r bg-muted transition-[translate] duration-200 ${frame}`}
    >
      <div
        className={`flex h-full flex-col ${drawer ? 'w-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]' : 'w-[248px]'}`}
      >
        <div className="flex shrink-0 items-center gap-1 px-2 pt-2 pb-1.5">
          <div className="min-w-0 flex-1">
            <AskField onNavigate={onPeekEnd} />
          </div>
          <button
            type="button"
            aria-label={drawer ? 'Close the sidebar' : 'Hide the sidebar (⌘\\)'}
            title={drawer ? 'Close sidebar' : 'Hide sidebar ⌘\\'}
            onClick={onFold}
            className={`grid shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent ${drawer ? 'size-10' : 'size-8'}`}
          >
            {drawer ? (
              <IconX className="size-5" />
            ) : (
              <IconLayoutSidebarLeftCollapse className="size-[15px]" />
            )}
          </button>
        </div>
        <div className="shrink-0 px-2 pb-1">
          <SidebarPlaces workspaceId={workspace.id} onNavigate={onPeekEnd} />
        </div>
        <SidebarPages workspaceId={workspace.id} onNavigate={onPeekEnd} />
        <WorkspaceFooter workspace={workspace} onNavigate={onPeekEnd} />
      </div>
    </aside>
  )
}
