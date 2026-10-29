import { getRouteApi } from '@tanstack/react-router'
import { DatabasesPage } from '@/components/databases'
import { useScreen } from './lib'

const workspaceRoute = getRouteApi('/w/$workspaceId')

export function DatabasesView() {
  const { workspace } = workspaceRoute.useLoaderData()
  useScreen('view:databases', ['Databases', workspace.name])
  return <DatabasesPage />
}
