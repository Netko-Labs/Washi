import { getRouteApi } from '@tanstack/react-router'
import { SettingsScreen, settingsLabel } from '@/components/settings'
import { useScreen } from './lib'

const settingsRoute = getRouteApi('/w/$workspaceId/settings')

export function SettingsView() {
  const { params, search } = settingsRoute.useMatch()
  const navigate = settingsRoute.useNavigate()
  useScreen('view:settings', ['Settings', settingsLabel(search.tab)])
  return (
    <SettingsScreen
      workspaceId={params.workspaceId}
      tab={search.tab}
      onTab={(tab) => void navigate({ search: { tab }, replace: true })}
    />
  )
}
