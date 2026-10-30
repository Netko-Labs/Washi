import { useState } from 'react'
import { styled } from '../../lib'
import { usePaperHost } from '../../provider'
import { FormDialog } from '../form'
import { AgendaDay } from './agenda-day'
import { AgendaEventMenu } from './agenda-event-menu'
import {
  AGENDA_MONTH_LIMIT,
  type AgendaPick,
  type AgendaProps,
  rowsByDay,
  useAgendaPeriod,
} from './lib'

/**
 * A week or a month of rows on their dates, the way a calendar shows it: today marked, ‹ › to
 * move, each row opening where the reader is. With `add`, a day's + opens a modal Form on that day.
 * A host that adds rows gives each event a ⋯: Duplicate, Copy to…, Repeat on days….
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
  view = 'week',
  state: stateKey,
  ...rest
}: AgendaProps) {
  const host = usePaperHost()
  const period = useAgendaPeriod({ bind, date, weekStart, view, stateKey, locale: host.locale })
  const [pick, setPick] = useState<AgendaPick>(null)
  const adding = pick?.kind === 'add' ? pick.day : null
  const byDay = rowsByDay(period.state.rows, date)
  const columns = { date, title, time, end, badge }
  const addingOn = period.days.find((day) => day.key === adding)
  const unit = view === 'month' ? 'month' : 'week'

  return (
    <div {...styled(rest, 'wsx-agenda')} data-view={view}>
      <div className="wsx-agenda-bar">
        <span className="wsx-agenda-range">{period.label}</span>
        <div className="wsx-agenda-nav">
          <button type="button" aria-label={`Previous ${unit}`} onClick={() => period.shift(-1)}>
            ‹
          </button>
          <button type="button" disabled={period.isCurrent} onClick={period.reset}>
            Today
          </button>
          <button type="button" aria-label={`Next ${unit}`} onClick={() => period.shift(1)}>
            ›
          </button>
        </div>
      </div>
      {period.state.status === 'error' ? (
        <div className="wsx-empty" data-state="error" role="alert">
          This {unit} could not load — {period.state.error}
        </div>
      ) : (
        <div className="wsx-agenda-days" aria-busy={period.state.status === 'loading' || undefined}>
          {view === 'month' &&
            period.days.slice(0, 7).map((day) => (
              <span key={day.weekday} className="wsx-agenda-head" aria-hidden>
                {day.weekday}
              </span>
            ))}
          {period.days.map((day) => (
            <AgendaDay
              key={day.key}
              day={day}
              rows={byDay.get(day.key) ?? []}
              columns={columns}
              empty={empty}
              limit={view === 'month' ? AGENDA_MONTH_LIMIT : undefined}
              onAdd={add ? () => setPick({ kind: 'add', day: day.key }) : undefined}
              onOpen={host.openRow}
              onMenu={host.newRow ? (row) => setPick({ kind: 'event', row }) : undefined}
            />
          ))}
        </div>
      )}
      {add && (
        <FormDialog
          open={adding !== null}
          onClose={() => setPick(null)}
          title={`${addLabel ?? 'Add'}${addingOn ? ` · ${addingOn.long}` : ''}`}
          table={bind.table}
          fields={add}
          submit={addLabel}
          seed={adding ? { [date]: adding } : undefined}
        />
      )}
      {pick?.kind === 'event' && (
        <AgendaEventMenu
          row={pick.row}
          table={bind.table}
          columns={columns}
          weekStart={weekStart}
          locale={host.locale}
          onClose={() => setPick(null)}
        />
      )}
    </div>
  )
}
