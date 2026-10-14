import { AgentMascot, VaultIcon } from '@washi/ui'
import { useState } from 'react'
import { InviteBanner } from '@/components/invite'
import { signOut, useSession } from '@/integrations/auth'
import { useWorkspaces } from './lib'

/**
 * The rest of onboarding. A workspace is one SQLite file and one organization,
 * so "create a workspace" and "start a team" are the same action — which is
 * why there is no separate team step.
 */
export function WorkspacePicker({ onOpen }: { onOpen: (id: string) => void }) {
  const { workspaces, loading, error, create, open } = useWorkspaces()
  const { data: session } = useSession()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!name.trim()) return
    setBusy(true)
    const id = await create(name.trim()).finally(() => setBusy(false))
    if (id) {
      setName('')
      open(id)
      onOpen(id)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-12">
      <div className="flex items-center gap-2.5">
        <AgentMascot state={workspaces.length ? 'idle' : 'suggesting'} size={44} />
        <p className="font-semibold text-[15px] tracking-[0.18em] uppercase">和紙 washi</p>
      </div>
      <h1 className="mt-6 font-semibold text-[26px] tracking-[-0.02em]">
        {workspaces.length ? 'Your workspaces' : 'Make your first workspace'}
      </h1>
      <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">
        {workspaces.length
          ? 'Each one is its own set of pages, and its own set of people.'
          : 'A workspace holds your pages and the people you invite to review them.'}
      </p>

      <InviteBanner
        onAccepted={(id) => {
          open(id)
          onOpen(id)
        }}
      />

      {loading && <p className="mt-8 text-[14px] text-muted-foreground">Loading…</p>}

      {workspaces.length > 0 && (
        <ul className="mt-8 grid gap-2">
          {workspaces.map((workspace) => (
            <li key={workspace.id}>
              <button
                type="button"
                onClick={() => {
                  open(workspace.id)
                  onOpen(workspace.id)
                }}
                className="flex h-14 w-full items-center gap-3 rounded-xl border border-border bg-card px-4 text-left hover:border-primary"
              >
                <VaultIcon topic="plain" size={32} className="shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-[14px]">{workspace.name}</span>
                  <span className="block text-[12px] text-muted-foreground">{workspace.role}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-8 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={workspaces.length ? 'Another workspace…' : 'Netko Labs'}
          className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-card px-3 text-[14px] outline-none focus-visible:border-primary"
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="h-11 shrink-0 rounded-xl bg-primary px-5 font-semibold text-[14px] text-primary-foreground disabled:opacity-50"
        >
          Create
        </button>
      </form>

      {error && <p className="mt-3 text-[13px] text-destructive">{error}</p>}

      <p className="mt-10 text-[13px] text-muted-foreground">
        Signed in as {session?.user.email}{' '}
        <button
          type="button"
          onClick={() => void signOut().then(() => window.location.reload())}
          className="underline underline-offset-4"
        >
          Sign out
        </button>
      </p>
    </main>
  )
}
