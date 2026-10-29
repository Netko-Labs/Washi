import { getRouteApi } from '@tanstack/react-router'
import { Inbox } from '@washi/ui'
import { FirstRunGate } from '@/components/first-run'
import { useInboxRows, useScreen } from './lib'

const workspaceRoute = getRouteApi('/w/$workspaceId')

export function InboxView() {
  const { workspace } = workspaceRoute.useLoaderData()
  useScreen('view:inbox', ['Inbox', workspace.name])
  const rows = useInboxRows()
  return (
    <FirstRunGate workspace={workspace}>
      <Inbox rows={rows} />
    </FirstRunGate>
  )
}
