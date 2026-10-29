import { AgentMascot } from '@washi/ui'
import { type ConsentPageProps, useConsent } from './lib'

/** "Claude Code wants to work in Washi as you" — in the one workspace the person picks here. */
export function ConsentPage({ clientId }: ConsentPageProps) {
  const { state, choose, answer } = useConsent(clientId)
  const name = state.clientName ?? 'An agent'

  return (
    <main className="grid min-h-dvh place-items-center bg-muted px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border border-border bg-background p-7 shadow-sm">
        <AgentMascot state="idle" size={56} className="mb-5" />
        <h1 className="font-semibold text-[22px] leading-snug tracking-[-0.01em]">
          {name} wants to work in Washi as you
        </h1>
        <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">
          It will read what you can read in the workspace you pick, and write pages, rows and
          comments as you — each in its history. It cannot reach past that workspace.
        </p>

        {state.workspaces.length > 0 && (
          <fieldset className="mt-5 grid gap-1.5">
            <legend className="mb-2 font-medium text-[13px]">Workspace</legend>
            {state.workspaces.map((workspace) => (
              <label
                key={workspace.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-border px-3 py-2.5 text-[14px] has-[:checked]:border-primary has-[:checked]:bg-accent"
              >
                <input
                  type="radio"
                  className="accent-primary"
                  name="workspace"
                  checked={state.chosen === workspace.id}
                  onChange={() => choose(workspace.id)}
                />
                {workspace.name}
              </label>
            ))}
          </fieldset>
        )}

        {state.error && (
          <p role="alert" className="mt-4 text-[13px] text-destructive">
            {state.error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={state.busy}
            onClick={() => void answer(false)}
            className="h-9 rounded-[10px] border border-border px-4 text-[13.5px] hover:bg-accent disabled:opacity-50"
          >
            Deny
          </button>
          <button
            type="button"
            disabled={state.busy || !state.chosen}
            onClick={() => void answer(true)}
            className="h-9 rounded-[10px] bg-foreground px-4 font-medium text-[13.5px] text-background disabled:opacity-50"
          >
            {state.busy ? 'Allowing…' : 'Allow'}
          </button>
        </div>
      </section>
    </main>
  )
}
