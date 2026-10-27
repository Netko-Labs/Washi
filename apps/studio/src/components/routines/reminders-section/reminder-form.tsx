import { useState } from 'react'
import { deviceTimeZone } from '../lib'
import { dateColumns, draftFor, inputOf, onlyOptions, type ReminderFormProps } from './lib'

const FIELD =
  'h-9 rounded-lg border border-border bg-background px-2.5 text-[13px] outline-none focus-visible:border-primary'

/** A rule in one line: remind ‹n› days before ‹date› of ‹table›, ‹every row | only unpaid›. */
export function ReminderForm({ tables, onCreate, onCancel }: ReminderFormProps) {
  const [draft, setDraft] = useState(() => draftFor(tables[0]))
  const [isSaving, setIsSaving] = useState(false)
  const table = tables.find((each) => each.name === draft.table)
  const canSave = !!draft.table && !!draft.dateColumn && !isSaving

  const save = async () => {
    setIsSaving(true)
    const isDone = await onCreate(inputOf(draft, deviceTimeZone()))
    setIsSaving(false)
    if (isDone) onCancel()
  }

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4">
      <input
        value={draft.title}
        onChange={(event) => setDraft({ ...draft, title: event.target.value })}
        placeholder="Bills due"
        aria-label="Reminder name"
        className={`${FIELD} w-full`}
      />
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
        Remind
        <input
          type="number"
          min={0}
          max={60}
          value={draft.daysBefore}
          onChange={(event) =>
            setDraft({
              ...draft,
              daysBefore: Math.min(60, Math.max(0, Math.round(Number(event.target.value) || 0))),
            })
          }
          aria-label="Days before"
          className={`${FIELD} w-16`}
        />
        days before
        <select
          value={draft.dateColumn}
          onChange={(event) => setDraft({ ...draft, dateColumn: event.target.value })}
          aria-label="Date column"
          className={FIELD}
        >
          {dateColumns(table).map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        of
        <select
          value={draft.table}
          onChange={(event) =>
            setDraft({
              ...draftFor(tables.find((each) => each.name === event.target.value)),
              title: draft.title,
              daysBefore: draft.daysBefore,
            })
          }
          aria-label="Table"
          className={FIELD}
        >
          {tables.map((each) => (
            <option key={each.id}>{each.name}</option>
          ))}
        </select>
        <select
          value={draft.only}
          onChange={(event) => setDraft({ ...draft, only: event.target.value })}
          aria-label="Which rows"
          className={FIELD}
        >
          <option value="">Every row</option>
          {onlyOptions(table).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canSave}
          onClick={() => void save()}
          className="h-8 rounded-lg bg-foreground px-3 font-medium text-[12.5px] text-background disabled:opacity-40"
        >
          {isSaving ? 'Saving…' : 'Add reminder'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-8 rounded-lg px-3 text-[12.5px] text-muted-foreground hover:bg-accent"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
