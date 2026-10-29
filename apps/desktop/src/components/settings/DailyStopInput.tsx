import { useState } from 'react'
import type { DailyStopInputProps } from './lib'

export function DailyStopInput({ capUsd, onSave }: DailyStopInputProps) {
  const [draft, setDraft] = useState(String(capUsd))
  const value = Number(draft)
  const changed = Number.isFinite(value) && value > 0 && value !== capUsd

  return (
    <form
      className="flex flex-none items-center gap-1.5"
      onSubmit={(event) => {
        event.preventDefault()
        if (changed) onSave(value)
      }}
    >
      <span className="font-mono text-[13px] text-muted-foreground">$</span>
      <input
        inputMode="decimal"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        aria-label="Daily stop in US dollars"
        className="h-8 w-16 rounded-[10px] border border-border bg-background px-2 font-mono text-[13px] outline-none focus-visible:border-primary"
      />
      {changed && (
        <button
          type="submit"
          className="h-8 rounded-[10px] border border-border bg-background px-3 text-[13px] hover:bg-accent"
        >
          Set
        </button>
      )}
    </form>
  )
}
