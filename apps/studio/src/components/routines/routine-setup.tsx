import { cronProblem } from '@washi/domain'
import { cronFromSchedule, type RoutineSetupProps } from './lib'
import { SchedulePicker } from './schedule-picker'

const LABEL = 'mb-2 block font-medium text-[12px] text-muted-foreground uppercase tracking-[0.06em]'
const BOX = 'rounded-2xl border border-border bg-card p-5'

/** The routine as one sentence: When ‹schedule›, Washi ‹does this› — then its name. */
export function RoutineSetup({
  draft,
  onDraft,
  isNew,
  isSaving,
  isChanged,
  onSave,
  onRemove,
}: RoutineSetupProps) {
  // An emptied time box is "", which would save as midnight nobody chose.
  const hasTime = draft.schedule.kind === 'custom' || /^\d{2}:\d{2}$/.test(draft.schedule.time)
  const isSchedule = !cronProblem(cronFromSchedule(draft.schedule))
  const canSave = draft.prompt.trim().length > 0 && hasTime && isSchedule && isChanged && !isSaving

  return (
    <div className="grid gap-3">
      <section className={BOX}>
        <span className={LABEL}>When</span>
        <SchedulePicker
          value={draft.schedule}
          onChange={(schedule) => onDraft({ ...draft, schedule })}
        />
      </section>

      <section className={BOX}>
        <label className={LABEL} htmlFor="routine-prompt">
          Washi
        </label>
        <textarea
          id="routine-prompt"
          value={draft.prompt}
          onChange={(event) => onDraft({ ...draft, prompt: event.target.value })}
          rows={6}
          placeholder="Read the issues changed since yesterday and update the page titled “Standup”…"
          className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] leading-relaxed outline-none focus-visible:border-primary"
        />
        <p className="mt-2 text-[12px] text-muted-foreground">
          Each run is its own chat: reads pass, page edits land marked as Washi’s, and anything that
          leaves the server still asks at the desk.
        </p>
      </section>

      <section className={BOX}>
        <label className={LABEL} htmlFor="routine-title">
          Name
        </label>
        <input
          id="routine-title"
          value={draft.title}
          onChange={(event) => onDraft({ ...draft, title: event.target.value })}
          placeholder="Morning digest"
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13.5px] outline-none focus-visible:border-primary"
        />
      </section>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          disabled={!canSave}
          onClick={onSave}
          className="h-9 rounded-lg bg-foreground px-4 font-medium text-[13px] text-background disabled:opacity-40"
        >
          {isSaving ? 'Saving…' : isNew ? 'Create routine' : 'Save changes'}
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-auto h-9 rounded-lg px-3 text-[13px] text-destructive hover:bg-destructive/10"
          >
            Delete routine
          </button>
        )}
      </div>
    </div>
  )
}
