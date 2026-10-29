import { dayLabel, styled, useBind } from '../../lib'
import type { Row } from '../../lib/types'
import { usePaperHost } from '../../provider'
import { Bound } from '../states'
import { firstDay, HEAT_WEEKS, type HeatmapProps, heatGrid, heatQuery, totalsByDay } from './lib'

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
  const state = useBind(heatQuery(bind, date, from, weeks))

  // An empty calendar is an answer — nothing done yet — so once loaded it always draws.
  const draw = (rows: Row[]) => {
    const grid = heatGrid(totalsByDay(rows, date, value), from, weeks, today, locale)
    const sum = grid.total.toLocaleString(locale)
    return (
      <figure {...styled(rest, 'wsx-heatmap')} aria-label={`${label ?? 'Total'}: ${sum}`}>
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
        {label && (
          <figcaption className="wsx-heatmap-caption">
            {label} · <strong>{sum}</strong>
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
