import { IconPlus } from '@tabler/icons-react'
import { useState } from 'react'
import { datedTables, useReminderRules } from './lib'
import { ReminderForm } from './reminder-form'
import { ReminderRuleRow } from './reminder-rule-row'

const HEADING = 'font-medium text-[12px] text-muted-foreground uppercase tracking-[0.06em]'

/** Rules over dated rows: no turn runs, each row lands once in the Inbox before it is due (D77). */
export function RemindersSection() {
  const { reminders, tables, error, create, toggle, remove } = useReminderRules()
  const [isAdding, setIsAdding] = useState(false)
  const dated = datedTables(tables)

  return (
    <section className="mt-12">
      <div className="mb-1 flex items-center justify-between gap-4">
        <h2 className={HEADING}>Reminders</h2>
        {!isAdding && dated.length > 0 && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex h-8 items-center gap-1 rounded-lg px-2.5 text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <IconPlus className="size-3.5" />
            Add reminder
          </button>
        )}
      </div>
      <p className="mb-3 text-[12.5px] text-muted-foreground">
        A row with a date lands in the Inbox before it is due — once per date. Washi runs nothing,
        so nothing is spent.
      </p>

      {error && <p className="mb-3 text-[13px] text-destructive">{error}</p>}
      {isAdding && (
        <div className="mb-2">
          <ReminderForm tables={dated} onCreate={create} onCancel={() => setIsAdding(false)} />
        </div>
      )}
      {reminders && reminders.length > 0 && (
        <ul className="grid gap-2">
          {reminders.map((reminder) => (
            <ReminderRuleRow
              key={reminder.id}
              reminder={reminder}
              onToggle={(enabled) => void toggle(reminder.id, enabled)}
              onRemove={() => void remove(reminder.id)}
            />
          ))}
        </ul>
      )}
      {reminders?.length === 0 && !isAdding && (
        <p className="text-[13px] text-muted-foreground">
          {dated.length > 0
            ? 'No reminders yet.'
            : 'Add a date column to a table, then remind people before it comes.'}
        </p>
      )}
    </section>
  )
}
