import { addModeOf, styled } from '../../lib'
import { usePaperHost } from '../../provider'
import { FormDialog } from '../form'
import { AgendaDay } from './agenda-day'
import { AgendaEventCard } from './agenda-event-card'
import {
  AGENDA_MONTH_LIMIT,
  type AgendaProps,
  requestedByDay,
  rowsByDay,
  useAgendaAdd,
  useAgendaPeriod,
} from './lib'

/**
 * A week or a month of rows on their dates, the way a calendar shows it: today marked, ‹ › to
 * move. An event pressed opens its card — when it is, its properties, Open page, Duplicate, Copy
 * to…, Repeat…, Delete — changed in place by a member, read by a link. With `add`, a day's + opens
 * a modal Form on that day with its hours one press away. Times visitors asked for show as
 * Requested (D120).
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
  const mode = addModeOf(host)
  const adds = useAgendaAdd(mode === 'suggest')
  const { adding } = adds
  const byDay = rowsByDay(period.state.rows, date)
  const asked = requestedByDay(period.requested)
  const columns = { date, title, time, end, badge }
  const addingOn = period.days.find((day) => day.key === adding)
  const picked = adds.pick?.kind === 'event' ? adds.pick.row : null
  // The card follows the row as it is written: a change refetches the week underneath it.
  const shown = picked ? (period.state.rows.find((row) => row.id === picked.id) ?? picked) : null
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
      {adds.note && (
        <p className="wsx-slots-booked" role="status">
          {adds.note}
        </p>
      )}
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
              requested={asked.get(day.key)}
              columns={columns}
              empty={empty}
              limit={view === 'month' ? AGENDA_MONTH_LIMIT : undefined}
              locale={host.locale}
              onAdd={add && mode ? () => adds.open(day.key) : undefined}
              onPress={adds.openEvent}
            />
          ))}
        </div>
      )}
      {add && mode && (
        <FormDialog
          open={adding !== null}
          onClose={adds.close}
          onAdded={adds.landed}
          isBooking
          title={`${mode === 'suggest' ? 'Request' : (addLabel ?? 'Add')}${addingOn ? ` · ${addingOn.long}` : ''}`}
          table={bind.table}
          // The day sits after the first field (the title), its hours one press away — unless the
          // agenda keeps its hours in columns of their own, offered then as hours lists.
          fields={time || add.includes(date) ? add : [...add.slice(0, 1), date, ...add.slice(1)]}
          clocks={time ? { start: time, end } : undefined}
          submit={addLabel}
          seed={adding ? { [date]: adding } : undefined}
        />
      )}
      {shown && (
        <AgendaEventCard
          key={String(shown.id)}
          row={shown}
          table={bind.table}
          columns={columns}
          weekStart={weekStart}
          locale={host.locale}
          canWrite={mode === 'write'}
          canCopy={mode === 'write' && Boolean(host.newRow)}
          onOpenPage={host.openRow}
          onClose={adds.close}
        />
      )}
    </div>
  )
}
