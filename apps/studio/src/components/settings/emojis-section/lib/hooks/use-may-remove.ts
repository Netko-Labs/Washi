import { getRouteApi } from '@tanstack/react-router'
import { useSession } from '@/integrations/auth'

const workspaceRoute = getRouteApi('/w/$workspaceId')

/** Its adder removes an emoji, and so does an owner or admin — the server checks the same. */
export function useMayRemove() {
  const { workspace } = workspaceRoute.useLoaderData()
  const { data: session } = useSession()
  const isSteward = workspace.role === 'owner' || workspace.role === 'admin'
  const me = session?.user.id ?? null
  return (createdBy: string) => isSteward || createdBy === me
}
