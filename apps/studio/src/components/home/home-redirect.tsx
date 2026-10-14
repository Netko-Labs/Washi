import { Navigate } from '@tanstack/react-router'
import { pendingInvite } from '@/components/invite'
import { useSession } from '@/integrations/auth'
import { readActiveWorkspace } from '@/integrations/trpc'

/** `/` is a doorway: sign in, accept an invite, or go back to the last workspace. */
export function HomeRedirect() {
  const { data: session, isPending } = useSession()
  if (isPending) return null
  if (!session) return <Navigate to="/sign-in" search={{ redirect: undefined }} replace />
  const invite = pendingInvite()
  if (invite) return <Navigate to="/workspaces" search={{ invite }} replace />
  const last = readActiveWorkspace()
  if (last) return <Navigate to="/w/$workspaceId" params={{ workspaceId: last }} replace />
  return <Navigate to="/workspaces" search={{}} replace />
}
