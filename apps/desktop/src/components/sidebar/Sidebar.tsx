import {
  IconCalendar,
  IconCloudOff,
  IconEdit,
  IconInbox,
  IconLayoutDashboard,
  IconLayoutSidebarLeftCollapse,
  IconPlus,
  IconSearch,
} from '@tabler/icons-react'
import {
  ConfirmDeleteButton,
  SheetIcon,
  type TabKey,
  useAgentStore,
  useSheetsStore,
  useViewStore,
} from '@washi/ui'
import { UserRow } from '@/components/workspace/UserRow'
import { WorkspaceSwitcher } from '@/components/workspace/WorkspaceSwitcher'

const NAV: { tab: TabKey; label: string; icon: typeof IconLayoutDashboard }[] = [
  { tab: 'view:dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
  { tab: 'view:inbox', label: 'Inbox', icon: IconInbox },
  { tab: 'view:daily', label: 'Daily note', icon: IconCalendar },
]

/** 248px sidebar per Washi.dc.html rev 2: titlebar search, nav w/ inbox badge, tree. */
export function Sidebar() {
  const { sheets, activeId, createSheet, deleteSheet, openPalette } = useSheetsStore()
  const running = useAgentStore((state) => state.running)
  const inboxCount = useAgentStore((state) => state.approvals.length)
  const { activeTab, openTab } = useViewStore()

  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-border border-r bg-muted">
      <div
        className="flex h-9 shrink-0 items-center justify-end gap-0.5 pr-2"
        style={{ appRegion: 'drag' } as never}
      >
        <button
          type="button"
          aria-label="Search (⌘K)"
          title="Search (⌘K)"
          onClick={openPalette}
          className="grid size-6 place-items-center rounded-[7px] text-muted-foreground hover:bg-accent"
          style={{ appRegion: 'no-drag' } as never}
        >
          <IconSearch className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="New page"
          onClick={() => void createSheet()}
          className="grid size-6 place-items-center rounded-[7px] text-muted-foreground hover:bg-accent"
          style={{ appRegion: 'no-drag' } as never}
        >
          <IconEdit className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label="Collapse sidebar"
          className="grid size-6 place-items-center rounded-[7px] text-muted-foreground hover:bg-accent"
          style={{ appRegion: 'no-drag' } as never}
        >
          <IconLayoutSidebarLeftCollapse className="size-3.5" />
        </button>
      </div>

      <WorkspaceSwitcher pages={sheets.length} />

      <nav className="space-y-px px-2 pt-2">
        {NAV.map(({ tab, label, icon: Icon }) => (
          <button
            key={tab}
            type="button"
            onClick={() => openTab(tab)}
            className={`flex h-[30px] w-full items-center gap-2 rounded-lg px-2 text-[13px] ${
              activeTab === tab
                ? 'bg-accent font-medium text-foreground'
                : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            <Icon className="size-[15px]" />
            <span className="flex-1 text-left">{label}</span>
            {tab === 'view:inbox' && inboxCount > 0 && (
              <span className="flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-primary px-[5px] font-semibold text-[10.5px] text-primary-foreground">
                {inboxCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="px-4 pt-[18px] pb-1.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
        Workspace
      </div>

      <div className="flex-1 space-y-px overflow-y-auto px-2 pb-2">
        {sheets.map((sheet) => {
          const active = activeTab === `note:${sheet.id}`
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
                onClick={() => openTab(`note:${sheet.id}`)}
                className="flex h-full min-w-0 flex-1 items-center gap-2 px-2 text-left text-[13px]"
              >
                <SheetIcon name={sheet.icon} className="size-[15px] shrink-0" />
                <span className="truncate">{sheet.title}</span>
                {active && sheet.id === activeId && running && (
                  <span
                    className="ml-auto size-1.5 shrink-0 rounded-full bg-agent"
                    style={{ animation: 'wdot 2s ease-in-out infinite' }}
                  />
                )}
              </button>
              <span className="mr-1 hidden shrink-0 group-focus-within:block group-hover:block">
                <ConfirmDeleteButton
                  label={`Delete ${sheet.title}`}
                  onConfirm={() => void deleteSheet(sheet.id)}
                />
              </span>
            </div>
          )
        })}
        <button
          type="button"
          aria-label="New sheet"
          onClick={() => void createSheet()}
          className="flex h-[29px] w-full items-center gap-2 rounded-lg px-2 text-[13px] text-muted-foreground hover:bg-accent"
        >
          <IconPlus className="size-3.5" />
          New page
        </button>
      </div>

      <button
        type="button"
        onClick={() => openTab('view:settings')}
        className="flex w-full items-center gap-2 border-border border-t px-3 py-2 text-left text-[11.5px] text-muted-foreground hover:bg-accent"
      >
        <IconCloudOff className="size-3.5" />
        <span className="min-w-0 flex-1 truncate">Offline · this device only</span>
        <span className="size-1.5 flex-none rounded-full bg-muted-foreground" />
      </button>
      <UserRow />
    </aside>
  )
}
