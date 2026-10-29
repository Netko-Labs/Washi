import { getRouteApi } from '@tanstack/react-router'
import { ChatsPage } from '@/components/chats'
import { useRouteTab } from '@/components/shell'

const workspaceRoute = getRouteApi('/w/$workspaceId')

export function ChatsView() {
  const { workspaceId } = workspaceRoute.useParams()
  useRouteTab('view:chats')
  return <ChatsPage workspaceId={workspaceId} />
}
