import { getRouteApi } from '@tanstack/react-router'
import { TrashPage } from '@/components/trash'
import { useScreen } from './lib'

const workspaceRoute = getRouteApi('/w/$workspaceId')

export function TrashView() {
  const { workspace } = workspaceRoute.useLoaderData()
  useScreen('view:trash', ['Trash', workspace.name])
  return <TrashPage />
}
