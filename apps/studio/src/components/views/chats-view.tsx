import { getRouteApi, useParams } from '@tanstack/react-router'
import { ChatPage, ChatsPage } from '@/components/chats'
import { useRouteTab } from '@/components/shell'

const workspaceRoute = getRouteApi('/w/$workspaceId')

export function ChatsView() {
  const { workspaceId } = workspaceRoute.useParams()
  useRouteTab('view:chats')
  return <ChatsPage workspaceId={workspaceId} />
}

/** `/chats/new` has no id. Keyed by chat: another chat is another page, not new props. */
export function ChatView() {
  const { chatId } = useParams({ strict: false })
  useRouteTab('view:chats')
  return <ChatPage key={chatId ?? 'new'} chatId={chatId} />
}
