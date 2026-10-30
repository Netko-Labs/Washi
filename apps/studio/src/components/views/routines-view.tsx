import { getRouteApi } from '@tanstack/react-router'
import { RoutinesPage } from '@/components/routines'
import { useScreen } from './lib'

const workspaceRoute = getRouteApi('/w/$workspaceId')

export function RoutinesView() {
  const { workspace } = workspaceRoute.useLoaderData()
  useScreen('view:routines', ['Routines'])
  return <RoutinesPage workspaceId={workspace.id} />
}
