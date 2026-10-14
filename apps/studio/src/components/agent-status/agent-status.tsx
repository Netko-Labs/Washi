import { usd as formatUsd } from '@washi/ui'
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
      className="flex w-full flex-col gap-0.5 rounded-lg px-2 py-1.5 text-left hover:bg-accent"
    >
      <span className="flex items-center gap-2 text-[12.5px]">
        <span className={`size-2 shrink-0 rounded-full ${STATE_DOT[status.state]}`} />
        <span className="font-medium">Washi</span>
        <span className="text-muted-foreground">· {STATE_LABEL[status.state]}</span>
      </span>
      <span className="pl-4 font-mono text-[10.5px] text-muted-foreground">
        today {formatUsd(status.costUsd)} of ${status.capUsd} · {status.turns}{' '}
        {status.turns === 1 ? 'turn' : 'turns'}
        {status.savedUsd > 0 && ` · saved ${formatUsd(status.savedUsd)}`}
      </span>
    </button>
  )
}
