import { getRouteApi } from '@tanstack/react-router'
import { Dashboard } from '@washi/ui'
import { FirstRunGate } from '@/components/first-run'
import { useScreen } from './lib'

const workspaceRoute = getRouteApi('/w/$workspaceId')

export function DashboardView() {
  const { workspace } = workspaceRoute.useLoaderData()
  useScreen('view:dashboard', ['Home'])
  return (
    <FirstRunGate workspace={workspace}>
      <Dashboard />
    </FirstRunGate>
  )
}
