import { useEffect, useState } from 'react'
import { AuthScreen } from '@/components/auth'
import { pendingInvite } from '@/components/invite'
import { WorkspaceShell } from '@/components/shell'
import { WorkspacePicker } from '@/components/workspace'
import { useSession } from '@/lib/auth'
import { activeWorkspace, api, setActiveWorkspace } from '@/lib/rpc'
import type { WorkspaceSummary } from '@/lib/types'

/**
 * Three states, no router: signed out, choosing a workspace, inside one. Routes
 * arrive when there is more than one thing to link to — right now a URL would
 * only ever point at the same three screens.
 */
export function App() {
  const { data: session, isPending } = useSession()
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null)
  const [restoring, setRestoring] = useState(true)

  useEffect(() => {
    if (isPending) return
    if (!session) {
      setRestoring(false)
      return
    }
    // An invite link wins over the last workspace: the picker accepts it.
    const saved = pendingInvite() ? null : activeWorkspace()
    if (!saved) {
      setRestoring(false)
      return
    }
    api.workspaces.list
      .query()
      .then((list) => {
        // Membership can have been revoked since this id was written down.
        setWorkspace(list.find((entry) => entry.id === saved) ?? null)
        if (!list.some((entry) => entry.id === saved)) setActiveWorkspace(null)
      })
      .catch(() => setActiveWorkspace(null))
      .finally(() => setRestoring(false))
  }, [session, isPending])

  if (isPending || restoring) {
    return <div className="grid min-h-dvh place-items-center text-muted-foreground">…</div>
  }

  if (!session) {
    return <AuthScreen onDone={() => window.location.reload()} />
  }

  if (!workspace) {
    return (
      <WorkspacePicker
        onOpen={(id) =>
          void api.workspaces.list
            .query()
            .then((list) => setWorkspace(list.find((entry) => entry.id === id) ?? null))
        }
      />
    )
  }

  return (
    <WorkspaceShell
      workspace={workspace}
      onLeave={() => {
        setActiveWorkspace(null)
        setWorkspace(null)
      }}
    />
  )
}
