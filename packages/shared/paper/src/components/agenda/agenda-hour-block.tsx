import { clockLabel } from '../../lib'
import {
  type AgendaHourBlockProps,
  anchorOf,
  badgeOf,
  clockOf,
  eventTitle,
  HOUR_PX,
  hueOf,
} from './lib'

/**
 * One block on a time grid (D133), placed by its minutes and its lane among the blocks it
 * overlaps. An Open window spans the whole column behind the rest; a Busy one is greyed.
 */
export function AgendaHourBlock({
  block,
  range,
  columns,
  locale,
  isWindow,
  onPress,
}: AgendaHourBlockProps) {
  const { row } = block
  const title = isWindow ? 'Open for booking' : eventTitle(row, columns)
  const badge = isWindow ? null : badgeOf(row, columns)
  const from = clockLabel(clockOf(block.from), locale)
  const to = clockLabel(clockOf(block.to % (24 * 60)), locale)
  const time = `${block.startsBefore ? '…' : from}–${block.endsAfter ? '…' : to}`
  const minutes = block.to - block.from
  const style = {
    top: `${((block.from - range.from) / 60) * HOUR_PX}px`,
    height: `${Math.max((minutes / 60) * HOUR_PX - 2, 18)}px`,
    left: isWindow ? '0' : `calc(${(block.lane / block.lanes) * 100}% + 2px)`,
    width: isWindow ? '100%' : `calc(${100 / block.lanes}% - 4px)`,
  }
  return (
    <button
      type="button"
      className="wsx-hours-block"
      data-window={isWindow || undefined}
      data-busy={block.isBusy || undefined}
      data-short={minutes < 45 || undefined}
      data-hue={isWindow || block.isBusy ? undefined : hueOf(badge)}
      style={style}
      aria-label={`${title}, ${time}`}
      onClick={(event) => {
        event.stopPropagation()
        onPress(row, anchorOf(event.currentTarget))
      }}
    >
      {/* A button centres what overflows it; the words sit at the top of the block instead. */}
      <span className="wsx-hours-inner">
        <span className="wsx-hours-title">{title}</span>
        <span className="wsx-hours-time">{time}</span>
        {badge && minutes >= 75 && <span className="wsx-hours-badge">{badge}</span>}
      </span>
    </button>
  )
}
