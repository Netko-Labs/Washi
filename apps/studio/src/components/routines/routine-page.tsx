import { IconChevronLeft, IconPlayerPlay } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { describeCron } from '@washi/domain'
import { useWorkspaceTitle } from '@/components/shared/document-title'
import { cronFromSchedule, type RoutinePageProps, useRoutine } from './lib'
import { RoutineRuns } from './routine-runs'
import { RoutineSetup } from './routine-setup'
import { ToggleSwitch } from './toggle-switch'

const TABS = [
  { id: 'setup', label: 'Setup' },
  { id: 'runs', label: 'Runs' },
] as const

/** A routine as a page (D68): Setup is the sentence, Runs is every chat it started. */
export function RoutinePage({ workspaceId, routineId, template, tab }: RoutinePageProps) {
  const page = useRoutine(workspaceId, routineId, template)
  const isNew = !routineId
  const shown = isNew ? 'setup' : tab
  useWorkspaceTitle([isNew ? 'New routine' : page.routine?.title, 'Routines'])

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-none">
      <div className="mx-auto w-full max-w-[760px] px-6 pt-6 pb-16">
        <Link
          to="/w/$workspaceId/routines"
          params={{ workspaceId }}
          className="mb-4 flex h-8 w-fit items-center gap-1 rounded-lg px-2 text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <IconChevronLeft className="size-4" />
          All routines
        </Link>

        {page.missing ? (
          <p className="mt-16 text-center text-[13px] text-muted-foreground">
            This routine was deleted.
          </p>
        ) : (
          <>
            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="truncate font-semibold text-[26px] tracking-[-0.02em]">
                  {page.draft.title.trim() || (isNew ? 'New routine' : 'Untitled routine')}
                </h1>
                <p className="mt-1 text-[13.5px] text-muted-foreground">
                  {describeCron(cronFromSchedule(page.draft.schedule))}
                  {page.routine && !page.routine.enabled && ' · paused'}
                </p>
              </div>
              {page.routine && (
                <div className="flex shrink-0 items-center gap-3 pt-1.5">
                  <button
                    type="button"
                    onClick={() => void page.runNow()}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-[12.5px] hover:bg-accent"
                  >
                    <IconPlayerPlay className="size-3.5" />
                    Run now
                  </button>
                  <ToggleSwitch
                    isOn={page.routine.enabled}
                    label={page.routine.enabled ? 'Pause the routine' : 'Resume the routine'}
                    onChange={(enabled) => void page.toggle(enabled)}
                  />
                </div>
              )}
            </div>

            {!isNew && (
              <div className="mt-6 mb-5 flex gap-1 border-border border-b">
                {TABS.map((each) => (
                  <Link
                    key={each.id}
                    to="."
                    search={{ tab: each.id }}
                    replace
                    aria-current={shown === each.id ? 'page' : undefined}
                    className={`-mb-px h-9 border-b-2 px-3 font-medium text-[13px] ${
                      shown === each.id
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {each.label}
                    {each.id === 'runs' && page.runs.length > 0 && (
                      <span className="ml-1.5 text-muted-foreground tabular-nums">
                        {page.runs.length}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
            {isNew && <div className="mt-6" />}

            {page.error && <p className="mb-3 text-[13px] text-destructive">{page.error}</p>}

            {shown === 'setup' ? (
              <RoutineSetup
                draft={page.draft}
                onDraft={page.setDraft}
                isNew={isNew}
                isSaving={page.isSaving}
                isChanged={page.isChanged}
                onSave={() => void page.save()}
                onRemove={isNew ? undefined : () => void page.remove()}
              />
            ) : (
              <RoutineRuns workspaceId={workspaceId} runs={page.runs} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
