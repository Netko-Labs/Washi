import { IconClock, IconHome, IconInbox, IconMessages } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useAgentStore, useViewStore } from '@washi/ui'
import { useMentionsStore } from '@/components/mentions'
import { pathFor } from '@/components/shell'
import { openInPlace, type SidebarSectionProps } from './lib'

const ICON =
  'relative grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground md:size-[30px]'

/** The places that are not pages, in one row: Home, then Inbox · Chats · Routines as icons. */
export function SidebarPlaces({ workspaceId, onNavigate }: SidebarSectionProps) {
  const approvals = useAgentStore((state) => state.approvals.length)
  const mentions = useMentionsStore((state) => state.unread)
  const activeTab = useViewStore((state) => state.activeTab)
  const inboxCount = approvals + mentions
  const place = (tab: 'view:dashboard' | 'view:inbox' | 'view:chats') => () => {
    useViewStore.getState().openTab(tab)
    onNavigate()
  }

  return (
    <div className="flex items-center gap-1">
      <a
        href={pathFor(workspaceId, 'view:dashboard')}
        onClick={(event) => openInPlace(event, place('view:dashboard'))}
        className={`flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-[14px] md:h-[30px] md:text-[13px] ${
          !activeTab || activeTab === 'view:dashboard'
            ? 'bg-accent font-medium text-foreground'
            : 'text-muted-foreground hover:bg-accent'
        }`}
      >
        <IconHome className="size-[17px] md:size-[15px]" />
        Home
      </a>
      <a
        href={pathFor(workspaceId, 'view:inbox')}
        onClick={(event) => openInPlace(event, place('view:inbox'))}
        aria-label="Inbox"
        title="Inbox"
        className={`${ICON} ${activeTab === 'view:inbox' ? 'bg-accent text-foreground' : ''}`}
      >
        <IconInbox className="size-[17px] md:size-[15px]" />
        {inboxCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-primary px-1 font-semibold text-[9.5px] text-primary-foreground">
            {inboxCount}
          </span>
        )}
      </a>
      <a
        href={pathFor(workspaceId, 'view:chats')}
        onClick={(event) => openInPlace(event, place('view:chats'))}
        aria-label="Chats"
        title="Chats — your conversations with Washi"
        className={`${ICON} ${activeTab === 'view:chats' ? 'bg-accent text-foreground' : ''}`}
      >
        <IconMessages className="size-[17px] md:size-[15px]" />
      </a>
      <Link
        to="/w/$workspaceId/settings"
        params={{ workspaceId }}
        search={{ tab: 'routines' }}
        onClick={onNavigate}
        aria-label="Routines"
        title="Routines"
        className={ICON}
      >
        <IconClock className="size-[17px] md:size-[15px]" />
      </Link>
    </div>
  )
}
