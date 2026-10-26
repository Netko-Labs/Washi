import { IconPlus } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { AgentMascot, VaultIcon } from '@washi/ui'
import { InviteBanner } from '@/components/invite'
import { signOut, useSession } from '@/integrations/auth'
import { topicFor, useWorkspaces } from './lib'

/**
 * Where an account lands: its workspaces, an invitation to accept, and the way to `/new`. A
 * workspace is one SQLite file and one organization, so making one is starting a team.
 */
export function WorkspacePicker({ onOpen }: { onOpen: (id: string) => void }) {
  const { workspaces, loading, error, open } = useWorkspaces()
  const { data: session } = useSession()

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-12">
      <div className="flex items-center gap-2.5">
        <AgentMascot state={workspaces.length ? 'idle' : 'suggesting'} size={44} />
        <p className="font-semibold text-[15px] tracking-[0.18em] uppercase">washi</p>
      </div>
      <h1 className="mt-6 font-semibold text-[26px] tracking-[-0.02em]">
        {workspaces.length ? 'Your workspaces' : 'Make your first workspace'}
      </h1>
      <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">
        {workspaces.length
          ? 'Each one is its own set of pages, and its own set of people.'
          : 'A workspace holds your pages, your tables and the people you work with.'}
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
                <VaultIcon topic={topicFor(workspace.id)} size={32} className="shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-[14px]">{workspace.name}</span>
                  <span className="block text-[12px] text-muted-foreground">{workspace.role}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/new"
        className="mt-8 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold text-[14px] text-primary-foreground"
      >
        <IconPlus className="size-4" />
        {workspaces.length ? 'New workspace' : 'Make your first workspace'}
      </Link>

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
