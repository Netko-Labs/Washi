import { receiptLine } from '../agent/lib'
import { AgentMascot } from '../mascot'
import { useAgentStore } from '../stores/agent/agent-store'
import { useToday } from '../today'

/** Everything Washi is waiting on, answerable here, then what it did — nothing invented. */
export function Inbox() {
  const { approvals, resolveApproval } = useAgentStore()
  const { today } = useToday()
  const turns = today?.turns ?? []

  return (
    <div className="flex-1 overflow-y-auto">
      <section className="mx-auto max-w-[680px] px-10 pt-11 pb-[60px]">
        <h1 className="font-semibold text-[24px] tracking-[-0.02em]">Inbox</h1>
        <p className="mb-[22px] text-muted-foreground">
          Everything Washi wants you to look at, in one queue.
        </p>

        <div className="mb-[26px] overflow-hidden rounded-[14px] border border-border bg-card">
          {approvals.map((request) => (
            <div
              key={request.id}
              className="flex items-center gap-3 border-border border-b px-4 py-3 last:border-0"
            >
              <AgentMascot state="suggesting" size={22} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-[13px]">
                  Washi asks to run <span className="font-mono">{request.toolName}</span>
                </div>
                <div className="truncate font-mono text-[11.5px] text-muted-foreground">
                  {JSON.stringify(request.input ?? {}).slice(0, 140)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void resolveApproval(request.id, 'reject_once')}
                className="h-[26px] rounded-lg border border-border bg-background px-2.5 text-[12px] hover:bg-accent"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => void resolveApproval(request.id, 'allow_once')}
                className="h-[26px] rounded-lg bg-primary px-2.5 font-medium text-[12px] text-primary-foreground"
              >
                Accept
              </button>
            </div>
          ))}
          {approvals.length === 0 && (
            <div className="flex items-center gap-2.5 p-4 text-[13px] text-muted-foreground">
              <AgentMascot state="done" size={22} />
              Inbox zero — Washi has nothing waiting on you.
            </div>
          )}
        </div>

        <div className="mb-2.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
          Earlier
        </div>
        <div className="flex flex-col gap-3.5 pl-1">
          {turns.length === 0 && (
            <p className="text-[13px] text-muted-foreground">Nothing in the last day.</p>
          )}
          {turns.map((turn) => (
            <div key={`${turn.sessionId}-${turn.at}`} className="flex gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-agent" />
              <div className="min-w-0">
                <div className="truncate text-[13px] leading-normal">
                  {turn.prompt || turn.sessionTitle}
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {turn.receipt.stopReason === 'error'
                    ? (turn.receipt.error ?? 'failed')
                    : receiptLine(turn.receipt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
