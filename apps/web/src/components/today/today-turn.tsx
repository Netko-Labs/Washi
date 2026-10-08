import { receiptParts } from '@/components/agent'
import { clock, type TodayTurnProps } from './lib'

export function TodayTurn({ turn }: TodayTurnProps) {
  const failed = turn.receipt.stopReason === 'error'
  return (
    <li className="grid grid-cols-[3.5rem_1fr] gap-3 py-3">
      <span className="pt-0.5 font-mono text-[11.5px] text-muted-foreground">{clock(turn.at)}</span>
      <span className="min-w-0">
        <span className="block text-[14px] leading-snug">{turn.prompt || turn.sessionTitle}</span>
        {turn.tools.length > 0 && (
          <span className="mt-1 flex flex-wrap gap-1">
            {turn.tools.map((tool) => (
              <span
                key={tool}
                className="rounded-full border border-border px-2 py-0.5 font-mono text-[10.5px] text-muted-foreground"
              >
                {tool}
              </span>
            ))}
          </span>
        )}
        <span
          className={`mt-1.5 block font-mono text-[11px] ${failed ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          {failed
            ? (turn.receipt.error ?? 'the turn failed')
            : receiptParts(turn.receipt).join(' · ')}
        </span>
      </span>
    </li>
  )
}
