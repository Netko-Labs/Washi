import { Link } from '@tanstack/react-router'
import { relativeTime } from '@washi/ui'
import { DAY_MS, durationLabel, type RoutineRunsProps, startedAtMs } from './lib'
import { RunStatusBadge } from './run-status-badge'

/** Every run newest first, each one its chat; three numbers on top. */
export function RoutineRuns({ workspaceId, runs }: RoutineRunsProps) {
  const now = Date.now()
  const within = (days: number) =>
    runs.filter((run) => now - startedAtMs(run.startedAt) < days * DAY_MS)
  const tiles = [
    { label: 'Last 24 hours', value: within(1).length },
    { label: 'Last 7 days', value: within(7).length },
    { label: 'Failed', value: runs.filter((run) => run.status === 'failed').length },
  ]

  if (runs.length === 0) {
    return (
      <p className="rounded-2xl border border-border border-dashed px-5 py-10 text-center text-[13px] text-muted-foreground">
        No runs yet. Run it now, or wait for its next minute.
      </p>
    )
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-3 gap-2.5">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-border bg-card px-4 py-3">
            <div className="font-semibold text-[22px] tabular-nums">{tile.value}</div>
            <div className="text-[12px] text-muted-foreground">{tile.label}</div>
          </div>
        ))}
      </div>
      <ul className="overflow-hidden rounded-2xl border border-border bg-card">
        {runs.map((run) => (
          <li key={run.id} className="border-border border-t first:border-t-0">
            <Link
              to="/w/$workspaceId/chats/$chatId"
              params={{ workspaceId, chatId: run.sessionId }}
              className="flex items-center gap-3 px-4 py-3 text-[13px] hover:bg-accent/50"
            >
              <RunStatusBadge status={run.status} />
              <span className="min-w-0 flex-1 truncate">
                {run.trigger === 'schedule' ? 'On schedule' : 'Run by hand'}
              </span>
              <span className="w-20 shrink-0 text-right text-muted-foreground tabular-nums">
                {durationLabel(run.durationMs)}
              </span>
              <span className="w-16 shrink-0 text-right font-mono text-[12px] text-muted-foreground">
                ${run.costUsd.toFixed(2)}
              </span>
              <span className="w-24 shrink-0 text-right text-[12px] text-muted-foreground">
                {relativeTime(run.startedAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
