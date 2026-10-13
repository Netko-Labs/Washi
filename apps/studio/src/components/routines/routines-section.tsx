import { useRoutines } from './lib'
import { RoutineForm } from './routine-form'
import { RoutineRow } from './routine-row'

/**
 * What Washi does while nobody is watching. Each run is an ordinary turn — the
 * daily stop applies, and anything it writes waits for a person until morning.
 */
export function RoutinesSection() {
  const { routines, error, create, toggle, runNow, remove } = useRoutines()

  return (
    <section>
      <h2 className="font-bold text-[14px]">Routines</h2>
      <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
        Prompts Washi runs on its own, once a day. What they write waits under Needs you.
      </p>
      {routines.length > 0 && (
        <ul className="mt-2 divide-y divide-border">
          {routines.map((routine) => (
            <RoutineRow
              key={routine.id}
              routine={routine}
              onToggle={toggle}
              onRunNow={runNow}
              onRemove={remove}
            />
          ))}
        </ul>
      )}
      <RoutineForm onCreate={create} />
      {error && <p className="mt-2 text-[13px] text-destructive">{error}</p>}
    </section>
  )
}
