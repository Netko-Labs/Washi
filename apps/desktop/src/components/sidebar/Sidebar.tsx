import {
  IconArrowLeft,
  IconChartDots3,
  IconCircleDot,
  IconEdit,
  IconFileText,
  IconLayoutDashboard,
  IconLayoutSidebarLeftCollapse,
  IconPlus,
  IconSearch,
  IconSettings,
  IconTrash,
} from '@tabler/icons-react'
import { UserRow } from '@/components/workspace/UserRow'
import { WorkspaceSwitcher } from '@/components/workspace/WorkspaceSwitcher'
import { useAgentStore } from '@/stores/agent/agent-store'
import { useSheetsStore } from '@/stores/sheets/sheets-store'
import { type AppView, useViewStore } from '@/stores/view/view-store'

const NAV: { view: AppView; label: string; icon: typeof IconLayoutDashboard }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
  { view: 'graph', label: 'Graph', icon: IconChartDots3 },
  { view: 'settings', label: 'Settings', icon: IconSettings },
]

/** 248px sidebar per Washi.dc.html: toolbar, switcher, search, nav, tree, sync, user. */
export function Sidebar() {
  const { sheets, activeId, select, createSheet, deleteSheet, openPalette } = useSheetsStore()
  const running = useAgentStore((state) => state.running)
  const { view, setView } = useViewStore()

  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-border border-r bg-muted">
      {/* real traffic lights sit top-left (hiddenInset); toolbar rides the drag strip */}
      <div
        className="flex h-9 shrink-0 items-center justify-end gap-0.5 pr-2"
        style={{ appRegion: 'drag' } as never}
      >
        <button
          type="button"
          aria-label="Back"
          className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-accent"
          style={{ appRegion: 'no-drag' } as never}
        >
          <IconArrowLeft className="size-4" />
        </button>
        <button
          type="button"
          aria-label="New page"
          onClick={() => {
            void createSheet()
            setView('note')
          }}
          className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-accent"
          style={{ appRegion: 'no-drag' } as never}
        >
          <IconEdit className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Collapse sidebar"
          className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-accent"
          style={{ appRegion: 'no-drag' } as never}
        >
          <IconLayoutSidebarLeftCollapse className="size-4" />
        </button>
      </div>

      <WorkspaceSwitcher pages={sheets.length} />

      <div className="px-2 pt-2">
        <button
          type="button"
          onClick={openPalette}
          className="flex h-8 w-full items-center gap-2 rounded-[10px] border border-border bg-background px-2.5 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <IconSearch className="size-3.5" />
          Search sheets
          <kbd className="ml-auto rounded border border-border bg-muted px-1 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>
      </div>

      <nav className="space-y-px px-2 pt-2">
        {NAV.map(({ view: navView, label, icon: Icon }) => (
          <button
            key={navView}
            type="button"
            onClick={() => setView(navView)}
            className={`flex h-[30px] w-full items-center gap-2 rounded-lg px-2 text-[13px] ${
              view === navView
                ? 'bg-accent font-medium text-foreground'
                : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            <Icon className="size-[15px]" />
            {label}
          </button>
        ))}
      </nav>

      <div className="px-4 pt-[18px] pb-1.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
        Workspace
      </div>

      <div className="flex-1 space-y-px overflow-y-auto px-2 pb-2">
        {sheets.map((sheet) => {
          const active = sheet.id === activeId && view === 'note'
          return (
            <div
              key={sheet.id}
              className={`group flex h-[29px] items-center rounded-lg ${
                active ? 'bg-accent font-medium' : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <button
                type="button"
                aria-label={`Open ${sheet.title}`}
                onClick={() => {
                  select(sheet.id)
                  setView('note')
                }}
                className="flex h-full min-w-0 flex-1 items-center gap-2 px-2 text-left text-[13px]"
              >
                <IconFileText className="size-[15px] shrink-0" />
                <span className="truncate">
                  {sheet.icon ? `${sheet.icon} ` : ''}
                  {sheet.title}
                </span>
                {active && running && (
                  <span
                    className="ml-auto size-1.5 shrink-0 rounded-full bg-agent"
                    style={{ animation: 'wdot 2s ease-in-out infinite' }}
                  />
                )}
              </button>
              <button
                type="button"
                aria-label={`Delete ${sheet.title}`}
                onClick={() => void deleteSheet(sheet.id)}
                className="mr-1 hidden size-5 shrink-0 place-items-center rounded text-muted-foreground group-hover:grid hover:text-destructive"
              >
                <IconTrash className="size-3" />
              </button>
            </div>
          )
        })}
        <button
          type="button"
          aria-label="New sheet"
          onClick={() => {
            void createSheet()
            setView('note')
          }}
          className="flex h-[29px] w-full items-center gap-2 rounded-lg px-2 text-[13px] text-muted-foreground hover:bg-accent"
        >
          <IconPlus className="size-3.5" />
          New page
        </button>
      </div>

      <div className="flex items-center gap-2 border-border border-t px-3 py-2 text-[11.5px] text-muted-foreground">
        <IconCircleDot className="size-3.5 text-[#16a34a]" />
        Local · this device only
      </div>
      <UserRow />
    </aside>
  )
}
