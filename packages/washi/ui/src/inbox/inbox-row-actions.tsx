import { useState } from 'react'
import type { InboxRowActionsProps } from './lib'

const BUTTON = 'h-7 rounded-lg px-2.5 font-semibold text-[12px] disabled:opacity-60'

/** A row's own presses, under its text: one at a time, and a refusal said beside them. */
export function InboxRowActions({ actions }: InboxRowActionsProps) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1 pb-2 pl-[52px]">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          disabled={busy !== null}
          aria-busy={busy === action.label || undefined}
          className={`${BUTTON} ${
            action.isPrimary ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground'
          }`}
          onClick={() => {
            setBusy(action.label)
            setError(null)
            action
              .run()
              .catch((cause: unknown) =>
                setError(cause instanceof Error ? cause.message : String(cause)),
              )
              .finally(() => setBusy(null))
          }}
        >
          {action.label}
        </button>
      ))}
      {error && (
        <span role="alert" className="text-[12px] text-destructive">
          {error}
        </span>
      )}
    </div>
  )
}
