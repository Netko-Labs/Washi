import { IconClock, IconHome, IconInbox, IconMessages } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useAgentStore, useViewStore } from '@washi/ui'
import { useMentionsStore } from '@/components/mentions'
import { pathFor } from '@/components/shell'
import { openInPlace, type SidebarSectionProps } from './lib'

const ICON =
  'relative grid size-[30px] shrink-0 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground'

/** The places that are not pages, in one row: Home, then Inbox · Threads · Routines as icons. */
export function SidebarPlaces({ workspaceId, onNavigate }: SidebarSectionProps) {
  const approvals = useAgentStore((state) => state.approvals.length)
  const mentions = useMentionsStore((state) => state.unread)
  const activeTab = useViewStore((state) => state.activeTab)
  const inboxCount = approvals + mentions
  const place = (tab: 'view:dashboard' | 'view:inbox') => () => {
    useViewStore.getState().openTab(tab)
    onNavigate()
  }

  return (
    <div className="flex items-center gap-1">
      <a
        href={pathFor(workspaceId, 'view:dashboard')}
        onClick={(event) => openInPlace(event, place('view:dashboard'))}
        className={`flex h-[30px] min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-[13px] ${
          activeTab === 'view:dashboard'
            ? 'bg-accent font-medium text-foreground'
            : 'text-muted-foreground hover:bg-accent'
        }`}
      >
        <IconHome className="size-[15px]" />
        Home
      </a>
      <a
        href={pathFor(workspaceId, 'view:inbox')}
        onClick={(event) => openInPlace(event, place('view:inbox'))}
        aria-label="Inbox"
        title="Inbox"
        className={`${ICON} ${activeTab === 'view:inbox' ? 'bg-accent text-foreground' : ''}`}
      >
        <IconInbox className="size-[15px]" />
        {inboxCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-primary px-1 font-semibold text-[9.5px] text-primary-foreground">
            {inboxCount}
          </span>
        )}
      </a>
      <button
        type="button"
        onClick={() => {
          useAgentStore.getState().togglePanel()
          onNavigate()
        }}
        aria-label="Threads"
        title="Threads — the conversations with Washi"
        className={ICON}
      >
        <IconMessages className="size-[15px]" />
      </button>
      <Link
        to="/w/$workspaceId/settings"
        params={{ workspaceId }}
        search={{ tab: 'routines' }}
        onClick={onNavigate}
        aria-label="Routines"
        title="Routines"
        className={ICON}
      >
        <IconClock className="size-[15px]" />
      </Link>
    </div>
  )
}
