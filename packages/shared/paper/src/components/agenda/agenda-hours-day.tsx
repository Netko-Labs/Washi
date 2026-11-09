import { AgendaHourBlock } from './agenda-hour-block'
import { type AgendaHoursDayProps, HOUR_PX, slotAt } from './lib'

/** Minutes past the reader's midnight now, for today's line. */
const nowMinutes = () => {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

/**
 * One day of the time grid: its hour lines, its Open windows behind, its blocks over them, and on
 * today a line at the time it is. A press on empty time adds there, an hour from that half hour.
 */
export function AgendaHoursDay({
  day,
  blocks,
  range,
  columns,
  locale,
  isPicked,
  onPress,
  onAdd,
}: AgendaHoursDayProps) {
  const now = nowMinutes()
  const showsNow = day.isToday && now >= range.from && now < range.to
  return (
    <div
      className="wsx-hours-col"
      data-today={day.isToday || undefined}
      data-picked={isPicked || undefined}
      aria-label={day.long}
      role="group"
    >
      {onAdd && (
        <button
          type="button"
          className="wsx-hours-hit"
          aria-label={`Add on ${day.long}`}
          onClick={(event) => {
            const box = event.currentTarget.getBoundingClientRect()
            // A key press lands at the page's first hour; a pointer, at the half hour pressed.
            const offset = event.detail === 0 ? 0 : event.clientY - box.top
            onAdd(day.key, slotAt(day.key, range, offset, HOUR_PX))
          }}
        />
      )}
      {blocks.windows.map((block) => (
        <AgendaHourBlock
          key={`w-${String(block.row.id)}`}
          block={block}
          range={range}
          columns={columns}
          locale={locale}
          isWindow
          onPress={onPress}
        />
      ))}
      {blocks.timed.map((block) => (
        <AgendaHourBlock
          key={String(block.row.id)}
          block={block}
          range={range}
          columns={columns}
          locale={locale}
          onPress={onPress}
        />
      ))}
      {showsNow && (
        <span
          className="wsx-hours-now"
          aria-hidden
          style={{ top: `${((now - range.from) / 60) * HOUR_PX}px` }}
        />
      )}
    </div>
  )
}
