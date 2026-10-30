import { IconPlus } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { Mascot } from '@washi/ui'
import { ROUTINE_TEMPLATES, type RoutinesPageProps, useRoutines } from './lib'
import { RemindersSection } from './reminders-section'
import { RoutineListRow } from './routine-list-row'

/** Everything Washi does on its own, each with its switch; templates to start one in a click. */
export function RoutinesPage({ workspaceId }: RoutinesPageProps) {
  const { routines, error, toggle } = useRoutines()

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-none">
      <div className="fab-room mx-auto w-full max-w-[760px] px-6 pt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-semibold text-[26px] tracking-[-0.02em]">Routines</h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground leading-relaxed">
              What Washi does on its own, on a schedule. Every run is a chat you can open.
            </p>
          </div>
          <Link
            to="/w/$workspaceId/routines/new"
            params={{ workspaceId }}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 font-medium text-[13px] text-primary-foreground hover:bg-primary/90"
          >
            <IconPlus className="size-4" />
            New routine
          </Link>
        </div>

        {error && <p className="mt-4 text-[13px] text-destructive">{error}</p>}

        {routines?.length === 0 && (
          <div className="mt-12 flex flex-col items-center gap-3 text-center">
            <Mascot face="sleep" motion="breathe" size={72} className="mascot-motion" />
            <p className="font-serif text-[19px] italic">Nothing scheduled yet</p>
            <p className="max-w-72 text-[13px] text-muted-foreground">
              Start from a template below, or write your own.
            </p>
          </div>
        )}

        {routines && routines.length > 0 && (
          <ul className="mt-6 grid gap-2">
            {routines.map((routine) => (
              <RoutineListRow
                key={routine.id}
                workspaceId={workspaceId}
                routine={routine}
                onToggle={(enabled) => void toggle(routine.id, enabled)}
              />
            ))}
          </ul>
        )}

        <h2 className="mt-12 mb-3 font-medium text-[12px] text-muted-foreground uppercase tracking-[0.06em]">
          Start from a template
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-2.5">
          {ROUTINE_TEMPLATES.map((template) => (
            <Link
              key={template.key}
              to="/w/$workspaceId/routines/new"
              params={{ workspaceId }}
              search={{ template: template.key }}
              className="rounded-xl border border-border border-dashed px-4 py-3 hover:border-solid hover:bg-card dark:border-muted-foreground/50"
            >
              <span className="block font-medium text-[13.5px]">{template.title}</span>
              <span className="block text-[12.5px] text-muted-foreground">{template.blurb}</span>
            </Link>
          ))}
        </div>

        <RemindersSection />
      </div>
    </div>
  )
}
