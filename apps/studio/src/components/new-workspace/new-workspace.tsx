import { Link, useNavigate } from '@tanstack/react-router'
import { AgentMascot } from '@washi/ui'
import { InviteStep } from './invite-step'
import { useNewWorkspace } from './lib'
import { NameStep } from './name-step'
import { StartStep } from './start-step'
import { Stepper } from './stepper'

/**
 * A new workspace, one question a screen: its name, how it starts, who joins. Waking Washi is
 * the workspace's own first run, so the flow hands over to it rather than repeating it.
 */
export function NewWorkspace() {
  const flow = useNewWorkspace()
  const navigate = useNavigate()
  const open = () => {
    if (flow.made) void navigate({ to: '/w/$workspaceId', params: { workspaceId: flow.made.id } })
  }

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="flex h-14 items-center justify-between px-5">
        <span className="flex items-center gap-2">
          <AgentMascot state="suggesting" size={28} />
          <span className="font-semibold text-[13px] tracking-[0.18em] uppercase">washi</span>
        </span>
        {flow.made ? (
          <button
            type="button"
            onClick={open}
            className="h-9 rounded-lg px-3 text-[13px] text-muted-foreground hover:bg-accent"
          >
            Skip to {flow.made.name}
          </button>
        ) : (
          <Link
            to="/workspaces"
            className="grid h-9 place-items-center rounded-lg px-3 text-[13px] text-muted-foreground hover:bg-accent"
          >
            Cancel
          </Link>
        )}
      </header>

      <div className="mx-auto w-full max-w-xl flex-1 px-6 pt-8 pb-16 md:pt-16">
        <Stepper current={flow.step} />
        <div className="mt-10">
          {flow.step === 'name' && (
            <NameStep busy={flow.busy} error={flow.error} onName={(name) => void flow.name(name)} />
          )}
          {flow.step === 'start' && (
            <StartStep
              busy={flow.busy}
              error={flow.error}
              onStart={(starter) => void flow.start(starter)}
            />
          )}
          {flow.step === 'invite' && flow.made && (
            <InviteStep workspace={flow.made} onDone={open} />
          )}
        </div>
      </div>
    </main>
  )
}
