import { addModeOf, styled } from '../../lib'
import { usePaperHost } from '../../provider'
import { FormDialog } from '../form'
import { AgendaDay } from './agenda-day'
import { AgendaEventCard } from './agenda-event-card'
import { AgendaHours } from './agenda-hours'
import {
  AGENDA_HOURS,
  AGENDA_MONTH_LIMIT,
  type AgendaProps,
  requestedByDay,
  rowsByDay,
  useAgendaAdd,
  useAgendaPeriod,
} from './lib'

/** The add form's fields: the day after the first, and a member's Show-as after the day. */
function addFields(add: string[], date: string, time?: string, show?: string): string[] {
  const withDay = time || add.includes(date) ? add : [...add.slice(0, 1), date, ...add.slice(1)]
  if (!show || withDay.includes(show)) return withDay
  const at = withDay.indexOf(date)
  return at === -1
    ? [...withDay, show]
    : [...withDay.slice(0, at + 1), show, ...withDay.slice(at + 1)]
}

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
  hours = AGENDA_HOURS,
  show,
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
  const columns = { date, title, time, end, badge, show }
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
      ) : view === 'hours' ? (
        <AgendaHours
          days={period.days}
          rows={period.state.rows}
          columns={columns}
          hours={hours}
          locale={host.locale}
          isLoading={period.state.status === 'loading'}
          onPress={adds.openEvent}
          onAdd={add && mode ? (day, at) => adds.open(day, at) : undefined}
        />
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
          // agenda keeps its hours in columns of their own, offered then as hours lists. A member
          // also says what it is — an appointment, Busy, or Open for booking (D133).
          fields={addFields(add, date, time, mode === 'write' ? show : undefined)}
          clocks={time ? { start: time, end } : undefined}
          submit={addLabel}
          seed={adding ? { [date]: adds.addingAt ?? adding } : undefined}
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
