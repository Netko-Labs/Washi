import { getRouteApi, Outlet } from '@tanstack/react-router'
import { WorkspaceShell } from './workspace-shell'

const route = getRouteApi('/w/$workspaceId')

export function WorkspaceLayout() {
  const { workspace } = route.useLoaderData()
  return (
    <WorkspaceShell workspace={workspace}>
      <Outlet />
    </WorkspaceShell>
  )
}
