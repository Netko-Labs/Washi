import { activityByDay, type RowActivityProps, useRowActivity } from './lib'

/** Under a row's properties: who changed what, by day — "Juan ticked paid". */
export function RowActivity({ rowOf, people }: RowActivityProps) {
  const state = useRowActivity(String(rowOf.row.id))
  if (!state) return null

  const context = { spec: rowOf.table.spec, people, related: rowOf.related }
  const days = activityByDay(state.activity.changes, context)
  if (days.length === 0) return null
  return (
    <section className="mt-6 border-border border-t pt-4 text-[13px]" data-row-activity>
      <h2 className="mb-2 font-medium text-[12px] text-muted-foreground">Activity</h2>
      {days.map((day) => (
        <div key={day.label} className="mb-3">
          <div className="mb-1 text-[11.5px] text-muted-foreground/70">{day.label}</div>
          <ul className="flex flex-col gap-1">
            {day.entries.map((entry) => (
              <li key={entry.key} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 text-muted-foreground">
                  <span className="font-medium text-foreground">{entry.who}</span> {entry.what}
                </span>
                <time className="shrink-0 text-[11.5px] text-muted-foreground/70 tabular-nums">
                  {entry.time}
                </time>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {state.activity.more && (
        <button
          type="button"
          onClick={state.showMore}
          className="text-[12px] text-muted-foreground hover:text-foreground"
        >
          Show more
        </button>
      )}
    </section>
  )
}
