import { dayLabel, styled, useBind } from '../../lib'
import type { Row } from '../../lib/types'
import { usePaperHost } from '../../provider'
import { Bound } from '../states'
import {
  firstDay,
  HEAT_WEEKS,
  type HeatmapProps,
  heatGrid,
  heatQuery,
  isCapped,
  totalsByDay,
} from './lib'

/** GitHub's calendar of days (D103): each a square as dark as what it held, today at the end. */
export function Heatmap({
  bind,
  date,
  value,
  weeks = HEAT_WEEKS,
  label,
  weekStart = 'monday',
  empty,
  ...rest
}: HeatmapProps) {
  const { locale } = usePaperHost()
  const today = new Date().toLocaleDateString('sv')
  const from = firstDay(today, weeks, weekStart)
  const query = heatQuery(bind, date, from, weeks)
  const state = useBind(query)

  // An empty calendar is an answer — nothing done yet — so once loaded it always draws.
  const draw = (rows: Row[]) => {
    const grid = heatGrid(totalsByDay(rows, date, value), from, weeks, today, locale)
    const sum = grid.total.toLocaleString(locale)
    const partial = isCapped(rows, query)
      ? `the first ${rows.length.toLocaleString(locale)} rows only`
      : null
    return (
      <figure
        {...styled(rest, 'wsx-heatmap')}
        aria-label={`${label ?? 'Total'}: ${sum}${partial ? `, ${partial}` : ''}`}
      >
        <div className="wsx-heatmap-months" style={{ '--weeks': weeks } as Record<string, number>}>
          {grid.months.map((month, index) => (
            <span key={`${index}-${month}`}>{month}</span>
          ))}
        </div>
        <div className="wsx-heatmap-grid" style={{ '--weeks': weeks } as Record<string, number>}>
          {grid.weeks.map((days) =>
            days.map((cell) => (
              <i
                key={cell.key}
                className="wsx-heatmap-cell"
                data-level={cell.level}
                data-future={cell.isFuture || undefined}
                title={`${dayLabel(cell.key, locale)} · ${cell.total.toLocaleString(locale)}`}
              />
            )),
          )}
        </div>
        {(label || partial) && (
          <figcaption className="wsx-heatmap-caption">
            {label ?? 'Total'} · <strong>{sum}</strong>
            {partial && <span className="wsx-heatmap-partial"> · {partial}</span>}
          </figcaption>
        )}
      </figure>
    )
  }
  return state.status === 'ready' ? (
    draw(state.rows)
  ) : (
    <Bound state={state} empty={empty}>
      {draw}
    </Bound>
  )
}
