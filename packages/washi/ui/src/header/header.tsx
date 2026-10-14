import { AgentMascot } from '../mascot'
import { mascotStateFor, useAgentStore, useSheetsStore, useViewStore, viewOf } from '../stores'
import type { HeaderProps } from './lib/types'

const STATE_LABELS: Record<string, string> = {
  idle: 'Washi watching',
  reading: 'Washi reading',
  thinking: 'Washi thinking',
  writing: 'Washi writing',
  suggesting: 'Washi suggests',
  done: 'Washi done',
  flagged: 'Washi flagged an issue',
}

const VIEW_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  inbox: 'Inbox',
  daily: 'Daily note',
  settings: 'Settings',
}

/** 48px header: breadcrumb + agent status pill (Washi.dc.html rev 2 — no bot button, FAB rules). */
export function Header({ leading, actions }: HeaderProps) {
  const { sheets, activeId } = useSheetsStore()
  const transcript = useAgentStore((state) => state.transcript)
  const running = useAgentStore((state) => state.running)
  const approvals = useAgentStore((state) => state.approvals)
  const activeTab = useViewStore((state) => state.activeTab)
  const workspaceName = useViewStore((state) => state.workspaceName)

  const view = viewOf(activeTab)
  const active = sheets.find((sheet) => sheet.id === activeId)
  const mascotState = mascotStateFor(transcript, running, approvals)
  const leaf =
    view === 'note' ? (active ? active.title : 'All pages') : (VIEW_LABELS[view] ?? 'Washi')

  return (
    <header className="flex h-12 shrink-0 items-center gap-2.5 border-border border-b px-4">
      {leading}
      <div className="min-w-0 flex-1 truncate text-[13px]">
        <span className="text-muted-foreground">
          {workspaceName} <span className="opacity-50">/</span>
        </span>{' '}
        <span className="font-medium">{leaf}</span>
      </div>

      <div className="ml-auto flex flex-none items-center gap-1.5">
        {view === 'note' && (
          <div
            className="hidden h-[26px] items-center gap-1.5 rounded-full border border-agent border-dashed sm:flex px-2.5 text-[12px] text-muted-foreground"
            data-agent-pill
          >
            <AgentMascot state={mascotState} size={17} />
            {STATE_LABELS[mascotState]}
          </div>
        )}
        {actions}
      </div>
    </header>
  )
}
