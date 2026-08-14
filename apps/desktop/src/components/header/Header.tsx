import { IconRobot } from '@tabler/icons-react'
import { AgentMascot } from '@/components/mascot/AgentMascot'
import { mascotStateFor, useAgentStore } from '@/stores/agent/agent-store'
import { useSheetsStore } from '@/stores/sheets/sheets-store'
import { useViewStore } from '@/stores/view/view-store'

const STATE_LABELS: Record<string, string> = {
  idle: 'Washi watching',
  reading: 'Washi reading',
  thinking: 'Washi thinking',
  writing: 'Washi writing',
  suggesting: 'Washi suggests',
  done: 'Washi done',
  flagged: 'Washi flagged an issue',
}

/** 48px main header: breadcrumb + agent status pill + panel toggle (Washi.dc.html). */
export function Header() {
  const { sheets, activeId } = useSheetsStore()
  const transcript = useAgentStore((state) => state.transcript)
  const running = useAgentStore((state) => state.running)
  const approvals = useAgentStore((state) => state.approvals)
  const togglePanel = useAgentStore((state) => state.togglePanel)
  const view = useViewStore((state) => state.view)

  const active = sheets.find((sheet) => sheet.id === activeId)
  const mascotState = mascotStateFor(transcript, running, approvals)
  const leaf =
    view === 'note'
      ? active
        ? `${active.icon ?? ''} ${active.title}`.trim()
        : 'All pages'
      : view === 'dashboard'
        ? 'Dashboard'
        : view === 'graph'
          ? 'Graph'
          : 'Settings'

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-border border-b px-4">
      <div className="min-w-0 flex-1 truncate text-[13px]">
        <span className="text-muted-foreground">
          Personal vault <span className="opacity-50">/</span>
        </span>{' '}
        <span className="font-medium">{leaf}</span>
      </div>

      {view === 'note' && (
        <div
          className="flex h-[26px] items-center gap-1.5 rounded-full border border-agent border-dashed px-2.5 text-[12px] text-muted-foreground"
          data-agent-pill
        >
          <AgentMascot state={mascotState} size={17} />
          {STATE_LABELS[mascotState]}
        </div>
      )}

      <button
        type="button"
        aria-label="Toggle agent panel"
        onClick={togglePanel}
        className="grid size-[30px] place-items-center rounded-[9px] border border-border bg-background text-muted-foreground hover:text-foreground"
      >
        <IconRobot className="size-4" />
      </button>
    </header>
  )
}
