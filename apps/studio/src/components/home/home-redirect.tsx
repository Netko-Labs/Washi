import { Navigate } from '@tanstack/react-router'
import { pendingInvite } from '@/components/invite'
import { inviteReturn } from '@/components/workspace'
import { useSession } from '@/integrations/auth'
import { readActiveWorkspace } from '@/integrations/trpc'

/** `/` is a doorway: sign in, accept an invite, or go back to the last workspace. */
export function HomeRedirect() {
  const { data: session, isPending } = useSession()
  if (isPending) return null
  // Links sent before invites moved to /workspaces still carry ?invite= on the root.
  const invite = pendingInvite()
  if (!session) {
    return (
      <Navigate
        to="/sign-in"
        search={{ redirect: invite ? inviteReturn(invite) : undefined }}
        replace
      />
    )
  }
  if (invite) return <Navigate to="/workspaces" search={{ invite }} replace />
  const last = readActiveWorkspace()
  if (last) return <Navigate to="/w/$workspaceId" params={{ workspaceId: last }} replace />
  return <Navigate to="/workspaces" search={{}} replace />
}
