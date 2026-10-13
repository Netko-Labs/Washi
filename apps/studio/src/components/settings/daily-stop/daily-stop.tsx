import { useState } from 'react'
import type { DailyStopProps } from '../lib'

/** A stop, not a quota: at the cap Washi pauses until tomorrow or until someone resumes it. */
export function DailyStop({ capUsd, onSave }: DailyStopProps) {
  const [draft, setDraft] = useState(String(capUsd))
  const value = Number(draft)
  const changed = Number.isFinite(value) && value > 0 && value !== capUsd

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (changed) void onSave(value)
      }}
    >
      <span className="font-mono text-[14px]">$</span>
      <input
        inputMode="decimal"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        aria-label="Daily stop in US dollars"
        className="h-11 w-24 rounded-xl border border-border bg-card px-3 font-mono text-[14px] outline-none focus-visible:border-primary"
      />
      <span className="text-[13.5px] text-muted-foreground">a day</span>
      {changed && (
        <button
          type="submit"
          className="h-11 rounded-xl border border-border px-4 font-bold text-[13px] hover:bg-accent"
        >
          Set
        </button>
      )}
    </form>
  )
}
