import { IconPlayerPlay, IconTrash } from '@tabler/icons-react'
import { minuteUtcToLocal, type RoutineRowProps } from './lib'

export function RoutineRow({ routine, onToggle, onRunNow, onRemove }: RoutineRowProps) {
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <span className="w-14 shrink-0 font-mono text-[12px] text-muted-foreground">
        {minuteUtcToLocal(routine.minuteUtc)}
      </span>
      <span className="min-w-0 flex-[1_1_200px]">
        <span className={`block text-[14px] ${routine.enabled ? '' : 'text-muted-foreground'}`}>
          {routine.title}
        </span>
        <span className="block truncate text-[12.5px] text-muted-foreground">{routine.prompt}</span>
        {routine.lastRunDay && (
          <span className="block font-mono text-[11px] text-muted-foreground">
            last ran {routine.lastRunDay}
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          role="switch"
          aria-checked={routine.enabled}
          aria-label={`${routine.enabled ? 'Pause' : 'Resume'} ${routine.title}`}
          onClick={() => onToggle(routine.id, !routine.enabled)}
          className="grid h-11 w-14 place-items-center"
        >
          <span
            className={`flex h-5 w-9 items-center rounded-full p-0.5 ${
              routine.enabled ? 'justify-end bg-primary' : 'bg-border'
            }`}
          >
            <span className="size-4 rounded-full bg-card shadow-sm" />
          </span>
        </button>
        <button
          type="button"
          aria-label={`Run ${routine.title} now`}
          onClick={() => onRunNow(routine.id)}
          className="grid size-11 place-items-center rounded-lg hover:bg-accent"
        >
          <IconPlayerPlay className="size-4" />
        </button>
        <button
          type="button"
          aria-label={`Delete ${routine.title}`}
          onClick={() => onRemove(routine.id)}
          className="grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
        >
          <IconTrash className="size-4" />
        </button>
      </span>
    </li>
  )
}
