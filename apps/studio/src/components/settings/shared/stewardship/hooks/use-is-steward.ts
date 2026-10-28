import { getRouteApi } from '@tanstack/react-router'

const workspaceRoute = getRouteApi('/w/$workspaceId')

/** An owner or admin: who shapes what the whole workspace allows. The server checks the same. */
export function useIsSteward(): boolean {
  const { workspace } = workspaceRoute.useLoaderData()
  return workspace.role === 'owner' || workspace.role === 'admin'
}
