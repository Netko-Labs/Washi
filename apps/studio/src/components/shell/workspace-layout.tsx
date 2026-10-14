import { getRouteApi, Outlet } from '@tanstack/react-router'
import { WorkspaceShell } from './workspace-shell'

const route = getRouteApi('/w/$workspaceId')

export function WorkspaceLayout() {
  const { workspace } = route.useLoaderData()
  // A switch keeps the route matched, so without a fresh shell no route effect reruns.
  return (
    <WorkspaceShell key={workspace.id} workspace={workspace}>
      <Outlet />
    </WorkspaceShell>
  )
}
