import { receiptLine } from '../agent/lib'
import { ApprovalCard } from '../approval'
import { AgentMascot } from '../mascot'
import { useAgentStore } from '../stores'
import { useToday } from '../today'

/** Everything Washi is waiting on, answerable here, then what it did — nothing invented. */
export function Inbox() {
  const approvals = useAgentStore((state) => state.approvals)
  const resolveApproval = useAgentStore((state) => state.resolveApproval)
  const { today } = useToday()
  const turns = today?.turns ?? []

  return (
    <div className="flex-1 overflow-y-auto">
      <section className="mx-auto max-w-[680px] px-10 pt-11 pb-[60px]">
        <h1 className="font-semibold text-[24px] tracking-[-0.02em]">Inbox</h1>
        <p className="mb-[22px] text-muted-foreground">
          Everything Washi wants you to look at, in one queue.
        </p>

        <div className="mb-[26px] grid gap-3">
          {approvals.map((request) => (
            <ApprovalCard
              key={request.id}
              toolName={request.toolName}
              input={request.input}
              onDecide={(decision) => resolveApproval(request.id, decision)}
            />
          ))}
          {approvals.length === 0 && (
            <div className="flex items-center gap-2.5 rounded-[14px] border border-border bg-card p-4 text-[13px] text-muted-foreground">
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
