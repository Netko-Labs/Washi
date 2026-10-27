import { useState } from 'react'
import { styled } from '../../lib'
import { usePaperHost } from '../../provider'
import { FormDialog } from '../form'
import { AgendaDay } from './agenda-day'
import { type AgendaProps, rowsByDay, useAgendaWeek } from './lib'

/**
 * A week of rows on their dates, the way a calendar shows it: today marked, ‹ › to move, each
 * row opening where the reader is. With `add`, a day's + opens a modal Form already on that day.
 */
export function Agenda({
  bind,
  date,
  title,
  time,
  end,
  badge,
  add,
  addLabel,
  empty = 'Free',
  weekStart = 'monday',
  ...rest
}: AgendaProps) {
  const host = usePaperHost()
  const week = useAgendaWeek({ bind, date, weekStart, locale: host.locale })
  const [adding, setAdding] = useState<string | null>(null)
  const byDay = rowsByDay(week.state.rows, date)
  const columns = { date, title, time, end, badge }
  const addingOn = week.days.find((day) => day.key === adding)

  return (
    <div {...styled(rest, 'wsx-agenda')}>
      <div className="wsx-agenda-bar">
        <span className="wsx-agenda-range">{week.label}</span>
        <div className="wsx-agenda-nav">
          <button type="button" aria-label="Previous week" onClick={() => week.shift(-1)}>
            ‹
          </button>
          <button type="button" disabled={week.isThisWeek} onClick={week.reset}>
            Today
          </button>
          <button type="button" aria-label="Next week" onClick={() => week.shift(1)}>
            ›
          </button>
        </div>
      </div>
      {week.state.status === 'error' ? (
        <div className="wsx-empty" data-state="error" role="alert">
          This week could not load — {week.state.error}
        </div>
      ) : (
        <div className="wsx-agenda-days" aria-busy={week.state.status === 'loading' || undefined}>
          {week.days.map((day) => (
            <AgendaDay
              key={day.key}
              day={day}
              rows={byDay.get(day.key) ?? []}
              columns={columns}
              empty={empty}
              onAdd={add ? () => setAdding(day.key) : undefined}
              onOpen={host.openRow}
            />
          ))}
        </div>
      )}
      {add && (
        <FormDialog
          open={adding !== null}
          onClose={() => setAdding(null)}
          title={`${addLabel ?? 'Add'}${addingOn ? ` · ${addingOn.long}` : ''}`}
          table={bind.table}
          fields={add}
          submit={addLabel}
          seed={adding ? { [date]: adding } : undefined}
        />
      )}
    </div>
  )
}
