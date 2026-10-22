import { getRouteApi } from '@tanstack/react-router'
import { Inbox } from '@washi/ui'
import { FirstRunGate } from '@/components/first-run'
import { useMentionRows } from '@/components/mentions'
import { useRouteTab } from '@/components/shell'

const workspaceRoute = getRouteApi('/w/$workspaceId')

export function InboxView() {
  const { workspace } = workspaceRoute.useLoaderData()
  useRouteTab('view:inbox')
  const mentions = useMentionRows()
  return (
    <FirstRunGate workspace={workspace}>
      <Inbox rows={mentions} />
    </FirstRunGate>
  )
}
