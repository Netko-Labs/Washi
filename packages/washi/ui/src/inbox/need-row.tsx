import { useDescribeTool } from '../approval'
import { AgentMascot } from '../mascot'
import { editedAt } from '../page-time'
import { type NeedRowProps, whenLabel } from './lib'

/** A question from Washi as a row: what it wants and why it asks, answered inline. */
export function NeedRow({ request, now, onDecide }: NeedRowProps) {
  const describe = useDescribeTool()
  const { action, subject, details, outbound } = describe(request.toolName, request.input)
  const always =
    request.toolName === 'fetch_url'
      ? 'Always this site'
      : request.toolName === 'web_search'
        ? 'Always allow search'
        : 'Allow for this chat'
  const why = [details[0], outbound ? 'This reaches outside the workspace, so it asks.' : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="flex items-start gap-3 rounded-xl border border-agent/60 bg-card px-3 py-2.5">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center">
        <AgentMascot state="suggesting" size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] leading-snug">
          <span className="font-semibold">Washi</span> wants to {action}
          {subject && <span className="font-semibold"> {subject}</span>}
        </div>
        {why && <div className="text-[12.5px] text-muted-foreground">{why}</div>}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => void onDecide('allow_once')}
            className="h-7 rounded-lg bg-primary px-3 font-medium text-[12px] text-primary-foreground hover:opacity-90"
          >
            Allow
          </button>
          <button
            type="button"
            onClick={() => void onDecide('allow_always')}
            className="h-7 rounded-lg border border-border bg-background px-2.5 text-[12px] hover:bg-accent"
          >
            {always}
          </button>
          <button
            type="button"
            onClick={() => void onDecide('reject_once')}
            className="h-7 rounded-lg px-2 text-[12px] text-muted-foreground hover:text-foreground"
          >
            Not now
          </button>
        </div>
      </div>
      <span className="shrink-0 pt-0.5 text-[11px] text-muted-foreground">
        {whenLabel(editedAt(request.createdAt), now)}
      </span>
    </div>
  )
}
