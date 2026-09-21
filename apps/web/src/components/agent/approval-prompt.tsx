import type { ApprovalDecision, ApprovalView } from './lib'

/**
 * Review is the primary human verb. This is the screen that verb happens on —
 * the agent is blocked, mid-turn, until one of these buttons is pressed.
 */
export function ApprovalPrompt({
  approval,
  onDecide,
}: {
  approval: ApprovalView
  onDecide: (id: string, decision: ApprovalDecision) => void
}) {
  return (
    <div className="border-border border-t bg-card px-4 py-3">
      <p className="font-bold text-[13px]">
        Washi wants to run <span className="font-mono">{approval.toolName}</span>
      </p>
      {approval.input != null && (
        <pre className="mt-2 max-h-28 overflow-auto rounded-lg bg-muted p-2 font-mono text-[11px] leading-relaxed">
          {JSON.stringify(approval.input, null, 2).slice(0, 600)}
        </pre>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onDecide(approval.id, 'allow_once')}
          className="h-11 flex-1 rounded-xl bg-primary px-3 font-bold text-[13px] text-primary-foreground"
        >
          Allow
        </button>
        <button
          type="button"
          onClick={() => onDecide(approval.id, 'allow_always')}
          className="h-11 rounded-xl border border-border px-3 font-bold text-[13px]"
        >
          Always
        </button>
        <button
          type="button"
          onClick={() => onDecide(approval.id, 'reject_once')}
          className="h-11 rounded-xl border border-border px-3 font-bold text-[13px]"
        >
          Deny
        </button>
      </div>
    </div>
  )
}
