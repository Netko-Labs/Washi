import { useData } from '../../data'
import { styled, useBind } from '../../lib'
import { usePaperHost } from '../../provider'
import { Bound } from '../states'
import {
  calendarOf,
  moved,
  percent,
  type RoadmapProps,
  rowSpan,
  ticksOf,
  today,
  toIso,
} from './lib'
import { RoadmapRow } from './roadmap-row'

/** Notion's timeline: one bar per row from its date (a range, or `date` to `end`) on a shared calendar. */
export function Roadmap({ bind, date, end, title = 'title', empty, ...rest }: RoadmapProps) {
  const host = usePaperHost()
  const { refresh } = useData()
  const state = useBind(bind)

  const write = async (row: string, set: Record<string, string>) => {
    try {
      await host.runAction({ verb: 'table.update', table: bind.table, row, set })
    } finally {
      refresh()
    }
  }

  return (
    <Bound state={state} empty={empty}>
      {(rows) => {
        const spans = rows.map((row) => rowSpan(row, date, end))
        const calendar = calendarOf(spans.filter((span) => span !== null))
        return (
          <div {...styled(rest, 'wsx-roadmap')}>
            <div className="wsx-roadmap-row wsx-roadmap-head">
              <span />
              <div className="wsx-roadmap-track">
                {ticksOf(calendar).map((tick) => (
                  <span
                    key={tick.day}
                    className="wsx-roadmap-tick"
                    style={{ left: percent(tick.day, calendar) }}
                  >
                    {tick.label}
                  </span>
                ))}
                <i className="wsx-roadmap-today" style={{ left: percent(today(), calendar) }} />
              </div>
            </div>
            {rows.map((row, index) => {
              const id = String(row.id)
              const span = spans[index] ?? null
              return (
                <RoadmapRow
                  key={id}
                  span={span}
                  calendar={calendar}
                  title={String(row[title] ?? '') || 'Untitled'}
                  onMove={(days) =>
                    span
                      ? write(id, moved(span, days, date, row[end ?? ''] ? end : undefined))
                      : Promise.resolve()
                  }
                  onPlace={(day) => void write(id, { [date]: toIso(day) })}
                  onOpen={() => host.openRow?.(id)}
                />
              )
            })}
          </div>
        )
      }}
    </Bound>
  )
}
