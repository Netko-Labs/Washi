import { IconPlayerPlay, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { localToMinuteUtc, minuteUtcToLocal, type RoutineDraft, useRoutines } from './lib'
import { SettingsCard, SettingsRow, StaticToggle } from './SettingsControls'

const EMPTY: RoutineDraft = { title: '', prompt: '', time: '07:00' }

/** Prompts Washi runs once a day while this app is open — on your plan, like any turn. */
export function RoutinesCard() {
  const { routines, error, create, toggle, runNow, remove } = useRoutines()
  const [draft, setDraft] = useState<RoutineDraft>(EMPTY)
  const ready = draft.title.trim() && draft.prompt.trim()

  return (
    <SettingsCard>
      {routines.map((routine) => (
        <SettingsRow
          key={routine.id}
          title={`${minuteUtcToLocal(routine.minuteUtc)} · ${routine.title}`}
          sub={routine.prompt}
          wrap
        >
          <span className="flex flex-none items-center gap-1">
            <button
              type="button"
              aria-label={`${routine.enabled ? 'Pause' : 'Resume'} ${routine.title}`}
              onClick={() => toggle(routine.id, !routine.enabled)}
            >
              <StaticToggle on={routine.enabled} />
            </button>
            <button
              type="button"
              aria-label={`Run ${routine.title} now`}
              onClick={() => runNow(routine.id)}
              className="grid size-8 place-items-center rounded-lg hover:bg-accent"
            >
              <IconPlayerPlay className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label={`Delete ${routine.title}`}
              onClick={() => remove(routine.id)}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
            >
              <IconTrash className="size-3.5" />
            </button>
          </span>
        </SettingsRow>
      ))}
      <form
        className="flex flex-col gap-2 px-[18px] py-4"
        onSubmit={(event) => {
          event.preventDefault()
          if (!ready) return
          void create({
            title: draft.title.trim(),
            prompt: draft.prompt.trim(),
            minuteUtc: localToMinuteUtc(draft.time),
          }).then((ok) => ok && setDraft(EMPTY))
        }}
      >
        <div className="font-medium">Add a routine</div>
        <div className="flex gap-2">
          <input
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            placeholder="Morning digest"
            aria-label="Routine name"
            className="h-8 min-w-0 flex-1 rounded-[10px] border border-border bg-background px-2.5 text-[13px] outline-none focus-visible:border-primary"
          />
          <input
            type="time"
            value={draft.time}
            onChange={(event) => setDraft({ ...draft, time: event.target.value })}
            aria-label="Runs daily at"
            className="h-8 rounded-[10px] border border-border bg-background px-2.5 font-mono text-[12.5px] outline-none focus-visible:border-primary"
          />
        </div>
        <textarea
          value={draft.prompt}
          onChange={(event) => setDraft({ ...draft, prompt: event.target.value })}
          placeholder="Read yesterday's pages and update a page titled Digest."
          aria-label="What Washi should do"
          rows={2}
          className="resize-none rounded-[10px] border border-border bg-background px-2.5 py-2 text-[13px] outline-none focus-visible:border-primary"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!ready}
            className="h-8 rounded-[10px] bg-primary px-3 font-medium text-[13px] text-primary-foreground disabled:opacity-50"
          >
            Add routine
          </button>
          <span className="text-muted-foreground text-xs">
            Runs daily while Washi is open. Anything it writes waits for you.
          </span>
        </div>
        {error && <p className="text-[12.5px] text-destructive">{error}</p>}
      </form>
    </SettingsCard>
  )
}
