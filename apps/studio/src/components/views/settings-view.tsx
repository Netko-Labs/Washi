import { getRouteApi } from '@tanstack/react-router'
import { SettingsScreen } from '@/components/settings'
import { useRouteTab } from '@/components/shell'

const settingsRoute = getRouteApi('/w/$workspaceId/settings')

export function SettingsView() {
  const { params, search } = settingsRoute.useMatch()
  const navigate = settingsRoute.useNavigate()
  useRouteTab('view:settings')
  return (
    <SettingsScreen
      workspaceId={params.workspaceId}
      tab={search.tab}
      onTab={(tab) => void navigate({ search: { tab }, replace: true })}
    />
  )
}
