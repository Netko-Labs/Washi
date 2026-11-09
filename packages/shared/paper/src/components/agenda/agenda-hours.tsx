import { useEffect, useRef, useState } from 'react'
import { hourLabel } from '../../lib'
import { AgendaEvent } from './agenda-event'
import { AgendaHoursDay } from './agenda-hours-day'
import { type AgendaHoursProps, dayBlocks, HOUR_PX, hourRange } from './lib'

/**
 * A week by the hour, as Teams and Outlook draw it (D133): hours down the side, a column a day,
 * each timed row a block as long as it lasts, overlaps side by side; whole days in a row on top;
 * Open windows behind, Busy greyed. On a phone one day shows at a time, picked from a strip.
 */
export function AgendaHours({
  days,
  rows,
  columns,
  hours,
  locale,
  isLoading,
  onPress,
  onAdd,
}: AgendaHoursProps) {
  const today = Math.max(
    0,
    days.findIndex((day) => day.isToday),
  )
  const [picked, setPicked] = useState(today)
  const scroller = useRef<HTMLDivElement>(null)
  const perDay = days.map((day) => dayBlocks(rows, columns, day.key))
  const range = hourRange(hours, perDay)
  const marks = Array.from(
    { length: (range.to - range.from) / 60 },
    (_, at) => range.from + at * 60,
  )
  const hasAllDay = perDay.some((day) => day.allDay.length > 0)
  const opening = Number(hours.split('-')[0]?.slice(0, 2) ?? 8) * 60

  // The grid opens on the page's own hours, not on midnight, when it was widened past them.
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = Math.max(0, ((opening - range.from) / 60) * HOUR_PX)
  }, [opening, range.from])

  return (
    <div className="wsx-hours" aria-busy={isLoading || undefined}>
      <div className="wsx-hours-strip" role="tablist" aria-label="Day">
        {days.map((day, at) => (
          <button
            key={day.key}
            type="button"
            role="tab"
            aria-selected={at === picked}
            data-today={day.isToday || undefined}
            onClick={() => setPicked(at)}
          >
            <span>{day.weekday}</span>
            <strong>{day.day}</strong>
          </button>
        ))}
      </div>
      <div className="wsx-hours-head">
        <span className="wsx-hours-gutter" />
        {days.map((day, at) => (
          <div
            key={day.key}
            className="wsx-hours-dayhead"
            data-today={day.isToday || undefined}
            data-picked={at === picked || undefined}
          >
            <span className="wsx-agenda-weekday">{day.weekday}</span>
            <span className="wsx-agenda-date">{day.day}</span>
          </div>
        ))}
      </div>
      {hasAllDay && (
        <div className="wsx-hours-allday">
          <span className="wsx-hours-gutter">All day</span>
          {days.map((day, at) => (
            <div
              key={day.key}
              className="wsx-hours-alldaycell"
              data-picked={at === picked || undefined}
            >
              {perDay[at]?.allDay.map((row) => (
                <AgendaEvent
                  key={String(row.id)}
                  row={row}
                  columns={columns}
                  day={day.key}
                  locale={locale}
                  onPress={onPress}
                />
              ))}
            </div>
          ))}
        </div>
      )}
      <div ref={scroller} className="wsx-hours-scroll">
        <div
          className="wsx-hours-body"
          style={{ height: `${((range.to - range.from) / 60) * HOUR_PX}px` }}
        >
          <div className="wsx-hours-gutter wsx-hours-marks" aria-hidden>
            {marks.map((mark) => (
              <span key={mark} style={{ top: `${((mark - range.from) / 60) * HOUR_PX}px` }}>
                {hourLabel(mark, locale)}
              </span>
            ))}
          </div>
          {days.map((day, at) => (
            <AgendaHoursDay
              key={day.key}
              day={day}
              blocks={perDay[at] ?? { timed: [], windows: [], allDay: [] }}
              range={range}
              columns={columns}
              locale={locale}
              isPicked={at === picked}
              onPress={onPress}
              onAdd={onAdd}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
