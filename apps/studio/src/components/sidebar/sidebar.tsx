import { IconChevronLeft, IconEdit, IconSearch, IconX } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useAgentStore, useSheetsStore, useViewStore, VaultIcon } from '@washi/ui'
import { AgentStatus } from '@/components/agent-status'
import { setActiveWorkspace } from '@/integrations/trpc'
import type { SidebarProps } from './lib'
import { SidebarNav } from './sidebar-nav'
import { SidebarPages } from './sidebar-pages'
import { UserRow } from './user-row'

/** The desktop's 248px sidebar, as a drawer under `md` — same nav, same tree, web chrome. */
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
        <div className="flex h-12 shrink-0 items-center gap-1 px-2">
          <Link
            to="/workspaces"
            onClick={() => setActiveWorkspace(null)}
            aria-label="All workspaces"
            title="All workspaces"
            className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 text-left hover:bg-accent"
          >
            <IconChevronLeft className="size-3.5 shrink-0 text-muted-foreground" />
            <VaultIcon topic="plain" size={22} className="shrink-0" />
            <span className="truncate font-semibold text-[13px]">{workspace.name}</span>
          </Link>
          <button
            type="button"
            aria-label="Search (⌘K)"
            title="Search (⌘K)"
            onClick={() => {
              useSheetsStore.getState().openPalette()
              onClose()
            }}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
          >
            <IconSearch className="size-[15px]" />
          </button>
          <button
            type="button"
            aria-label="New page"
            title="New page"
            onClick={() => {
              void useSheetsStore.getState().createSheet()
              onClose()
            }}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
          >
            <IconEdit className="size-[15px]" />
          </button>
          <button
            type="button"
            aria-label="Close the sidebar"
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent md:hidden"
          >
            <IconX className="size-[15px]" />
          </button>
        </div>

        <SidebarNav workspaceId={workspace.id} onNavigate={onClose} />

        <div className="px-4 pt-[18px] pb-1.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
          Pages
        </div>
        <SidebarPages workspaceId={workspace.id} onNavigate={onClose} />

        <div className="border-border border-t px-2 py-1.5">
          <AgentStatus
            onOpenAgent={() => {
              useAgentStore.getState().togglePanel()
              onClose()
            }}
            onOpenSettings={() => {
              useViewStore.getState().openTab('view:settings')
              onClose()
            }}
          />
        </div>
        <UserRow />
      </aside>
    </>
  )
}
