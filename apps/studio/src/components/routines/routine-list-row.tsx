import { IconClock } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { describeCron, nextOccurrence } from '@washi/domain'
import { deviceTimeZone, type RoutineListRowProps, wallLabel } from './lib'
import { ToggleSwitch } from './toggle-switch'

/** A routine in one line: when, what it is, when it runs next, and its switch. */
export function RoutineListRow({ workspaceId, routine, onToggle }: RoutineListRowProps) {
  const next = routine.enabled ? nextOccurrence(routine.cron, routine.timeZone, new Date()) : null
  const zone = routine.timeZone === deviceTimeZone() ? '' : ` · ${routine.timeZone}`

  return (
    <li>
      <Link
        to="/w/$workspaceId/routines/$routineId"
        params={{ workspaceId, routineId: routine.id }}
        search={{ tab: 'setup' }}
        className="flex items-center gap-3.5 rounded-xl border border-border bg-card px-4 py-3.5 hover:border-foreground/20"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-muted-foreground">
          <IconClock className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate font-medium text-[14px] ${routine.enabled ? '' : 'text-muted-foreground'}`}
          >
            {routine.title}
          </span>
          <span className="block truncate text-[12.5px] text-muted-foreground">
            {describeCron(routine.cron)}
            {zone}
          </span>
        </span>
        <span className="hidden shrink-0 text-right text-[12px] text-muted-foreground sm:block">
          {routine.enabled ? (next ? `Next ${wallLabel(next)}` : 'Never due') : 'Paused'}
        </span>
        <ToggleSwitch
          isOn={routine.enabled}
          label={`${routine.enabled ? 'Pause' : 'Resume'} ${routine.title}`}
          onChange={onToggle}
        />
      </Link>
    </li>
  )
}
