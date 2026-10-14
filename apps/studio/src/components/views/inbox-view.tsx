import { getRouteApi } from '@tanstack/react-router'
import { Inbox } from '@washi/ui'
import { FirstRunGate } from '@/components/first-run'
import { useRouteTab } from '@/components/shell'

const workspaceRoute = getRouteApi('/w/$workspaceId')

export function InboxView() {
  const { workspace } = workspaceRoute.useLoaderData()
  useRouteTab('view:inbox')
  return (
    <FirstRunGate workspace={workspace}>
      <Inbox />
    </FirstRunGate>
  )
}
