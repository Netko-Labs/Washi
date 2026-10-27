import { describeCron, nextOccurrence } from '@washi/domain'
import {
  cronFromSchedule,
  SCHEDULE_KINDS,
  type SchedulePickerProps,
  WEEKDAY_SHORT,
  wallLabel,
} from './lib'

const FIELD =
  'h-9 rounded-lg border border-border bg-background px-2.5 text-[13px] outline-none focus-visible:border-primary'

/** A preset first, then only what that preset needs; the schedule read back in words. */
export function SchedulePicker({ value, onChange }: SchedulePickerProps) {
  const cron = cronFromSchedule(value)
  const next = nextOccurrence(cron, value.timeZone, new Date())
  const set = (patch: Partial<typeof value>) => onChange({ ...value, ...patch })

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-1.5">
        {SCHEDULE_KINDS.map((kind) => (
          <button
            key={kind.id}
            type="button"
            aria-pressed={value.kind === kind.id}
            onClick={() => set({ kind: kind.id, cron: kind.id === 'custom' ? cron : value.cron })}
            className={`h-8 rounded-full border px-3 text-[12.5px] ${
              value.kind === kind.id
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted-foreground hover:bg-accent'
            }`}
          >
            {kind.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {value.kind === 'custom' ? (
          <input
            value={value.cron}
            onChange={(event) => set({ cron: event.target.value })}
            aria-label="Cron schedule"
            placeholder="0 9 * * 1-5"
            className={`${FIELD} w-44 font-mono`}
          />
        ) : value.kind === 'hourly' ? (
          <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
            at minute
            <input
              type="number"
              min={0}
              max={59}
              value={Number(value.time.split(':')[1] ?? 0)}
              onChange={(event) =>
                set({
                  time: `00:${String(Math.min(59, Math.max(0, Number(event.target.value)))).padStart(2, '0')}`,
                })
              }
              className={`${FIELD} w-20`}
            />
          </label>
        ) : (
          <input
            type="time"
            value={value.time}
            onChange={(event) => set({ time: event.target.value })}
            aria-label="Time"
            className={`${FIELD} w-32`}
          />
        )}
        <input
          value={value.timeZone}
          onChange={(event) => set({ timeZone: event.target.value })}
          aria-label="Time zone"
          list="routine-zones"
          className={`${FIELD} w-52`}
        />
        <datalist id="routine-zones">
          {Intl.supportedValuesOf('timeZone').map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
      </div>

      {value.kind === 'weekly' && (
        <div className="flex gap-1">
          {WEEKDAY_SHORT.map((label, day) => {
            const isOn = value.days.includes(day)
            return (
              <button
                key={label}
                type="button"
                aria-pressed={isOn}
                onClick={() =>
                  set({
                    days: isOn ? value.days.filter((each) => each !== day) : [...value.days, day],
                  })
                }
                className={`size-9 rounded-lg border text-[12px] ${
                  isOn
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}

      <p className="text-[12.5px] text-muted-foreground">
        {describeCron(cron)} · {value.timeZone}
        {next ? ` — next ${wallLabel(next)}` : ' — not in the next week'}
      </p>
    </div>
  )
}
