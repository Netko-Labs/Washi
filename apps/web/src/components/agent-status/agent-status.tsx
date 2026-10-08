import { formatUsd } from '@/components/agent'
import { type AgentStatusProps, STATE_DOT, STATE_LABEL, useAgentStatus } from './lib'

/**
 * Washi's state, without opening anything. Asleep and paused lead to settings —
 * a key or a Resume is what they need; everything else opens the panel.
 */
export function AgentStatus({ onOpenAgent, onOpenSettings }: AgentStatusProps) {
  const status = useAgentStatus()
  if (!status) return null

  const needsSettings = status.state === 'asleep' || status.state === 'paused'
  return (
    <button
      type="button"
      onClick={needsSettings ? onOpenSettings : onOpenAgent}
      className="flex min-h-11 w-full flex-col gap-0.5 rounded-lg px-2.5 py-2 text-left hover:bg-accent"
    >
      <span className="flex items-center gap-2 text-[13px]">
        <span className={`size-2 shrink-0 rounded-full ${STATE_DOT[status.state]}`} />
        <span className="font-bold">Washi</span>
        <span className="text-muted-foreground">· {STATE_LABEL[status.state]}</span>
      </span>
      <span className="pl-4 font-mono text-[11px] text-muted-foreground">
        today {formatUsd(status.costUsd)} of ${status.capUsd} · {status.turns} turns
        {status.savedUsd > 0 && ` · saved ${formatUsd(status.savedUsd)}`}
      </span>
    </button>
  )
}
