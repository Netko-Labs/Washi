import { getRouteApi } from '@tanstack/react-router'
import { Dashboard } from '@washi/ui'
import { FirstRunGate } from '@/components/first-run'
import { useRouteTab } from '@/components/shell'

const workspaceRoute = getRouteApi('/w/$workspaceId')

export function DashboardView() {
  const { workspace } = workspaceRoute.useLoaderData()
  useRouteTab('view:dashboard')
  return (
    <FirstRunGate workspace={workspace}>
      <Dashboard />
    </FirstRunGate>
  )
}
