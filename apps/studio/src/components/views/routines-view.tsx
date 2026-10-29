import { getRouteApi } from '@tanstack/react-router'
import { RoutinesPage } from '@/components/routines'
import { useRouteTab } from '@/components/shell'

const workspaceRoute = getRouteApi('/w/$workspaceId')

export function RoutinesView() {
  const { workspaceId } = workspaceRoute.useParams()
  useRouteTab('view:routines')
  return <RoutinesPage workspaceId={workspaceId} />
}
