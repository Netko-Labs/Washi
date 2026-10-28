import { getRouteApi } from '@tanstack/react-router'
import { useSession } from '@/integrations/auth'

const workspaceRoute = getRouteApi('/w/$workspaceId')

/** What someone added, they or an owner or admin may change — the server checks the same. */
export function useMayChange() {
  const { workspace } = workspaceRoute.useLoaderData()
  const { data: session } = useSession()
  const isSteward = workspace.role === 'owner' || workspace.role === 'admin'
  const me = session?.user.id ?? null
  return (createdBy: string) => isSteward || createdBy === me
}
