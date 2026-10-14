import { useState } from 'react'
import {
  deviceTimeZone,
  ROUTINE_EXAMPLE,
  type RoutineDraft,
  type RoutineFormProps,
  toMinuteOfDay,
} from './lib'

export function RoutineForm({ onCreate }: RoutineFormProps) {
  const [draft, setDraft] = useState<RoutineDraft>({
    title: '',
    prompt: '',
    time: ROUTINE_EXAMPLE.time,
  })
  const ready = draft.title.trim() && draft.prompt.trim() && draft.time

  return (
    <form
      className="mt-4 grid gap-2 rounded-2xl border border-border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!ready) return
        void onCreate({
          title: draft.title.trim(),
          prompt: draft.prompt.trim(),
          minuteOfDay: toMinuteOfDay(draft.time),
          timeZone: deviceTimeZone(),
        }).then((ok) => ok && setDraft({ title: '', prompt: '', time: ROUTINE_EXAMPLE.time }))
      }}
    >
      <div className="flex gap-2">
        <input
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          placeholder={ROUTINE_EXAMPLE.title}
          aria-label="Routine name"
          className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-[14px] outline-none focus-visible:border-primary"
        />
        <input
          type="time"
          value={draft.time}
          onChange={(event) => setDraft({ ...draft, time: event.target.value })}
          aria-label="Runs daily at"
          className="h-11 w-28 shrink-0 rounded-xl border border-border bg-background px-3 font-mono text-[13px] outline-none focus-visible:border-primary"
        />
      </div>
      <textarea
        value={draft.prompt}
        onChange={(event) => setDraft({ ...draft, prompt: event.target.value })}
        placeholder={ROUTINE_EXAMPLE.prompt}
        aria-label="What Washi should do"
        rows={2}
        className="resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus-visible:border-primary"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!ready}
          className="h-11 rounded-xl bg-primary px-5 font-semibold text-[13.5px] text-primary-foreground disabled:opacity-50"
        >
          Add routine
        </button>
        <span className="text-[12px] text-muted-foreground leading-snug">
          Runs daily at that time, on your clock. Anything it writes waits for you.
        </span>
      </div>
    </form>
  )
}
