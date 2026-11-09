import { relativeTime } from '@washi/ui'
import { detailOf } from '../lib'
import { type PageSuggestionRowProps, useSuggestionDecide } from './lib'

const BUTTON =
  'h-7 shrink-0 rounded-md px-2.5 font-semibold text-[12.5px] disabled:cursor-progress disabled:opacity-60'

/** One visitor's request: who, what they filled in, when — and Approve or Decline in place. */
export function PageSuggestionRow({ suggestion }: PageSuggestionRowProps) {
  const decide = useSuggestionDecide(suggestion.id)
  const detail = detailOf(suggestion)

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px]">
          <span className="font-semibold">{suggestion.visitorName}</span>{' '}
          <span className="text-muted-foreground">
            {suggestion.visitorEmail && `${suggestion.visitorEmail} · `}
            {relativeTime(suggestion.hlcCreated)}
          </span>
        </p>
        <p className="truncate text-[13px] text-muted-foreground">
          {suggestion.kind === 'booking' ? 'Booking' : 'New row'} in {suggestion.tableName}
          {detail && ` — ${detail}`}
        </p>
        {decide.error && (
          <p role="alert" className="text-[12px] text-destructive">
            {decide.error}
          </p>
        )}
      </div>
      <button
        type="button"
        disabled={decide.busy !== null}
        aria-busy={decide.busy === 'approve' || undefined}
        onClick={decide.approve}
        className={`${BUTTON} bg-primary text-primary-foreground`}
      >
        Approve
      </button>
      <button
        type="button"
        disabled={decide.busy !== null}
        aria-busy={decide.busy === 'decline' || undefined}
        onClick={decide.decline}
        className={`${BUTTON} text-muted-foreground hover:bg-accent hover:text-foreground`}
      >
        Decline
      </button>
    </li>
  )
}
