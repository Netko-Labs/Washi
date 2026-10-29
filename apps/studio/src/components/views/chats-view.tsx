import { getRouteApi } from '@tanstack/react-router'
import { ChatsPage } from '@/components/chats'
import { useScreen } from './lib'

const workspaceRoute = getRouteApi('/w/$workspaceId')

export function ChatsView() {
  const { workspace } = workspaceRoute.useLoaderData()
  useScreen('view:chats', ['Chats', workspace.name])
  return <ChatsPage workspaceId={workspace.id} />
}
