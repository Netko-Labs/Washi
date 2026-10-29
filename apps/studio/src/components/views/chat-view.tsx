import { useParams } from '@tanstack/react-router'
import { ChatPage } from '@/components/chats'
import { useRouteTab } from '@/components/shell'

/** `/chats/new` has no id. Keyed by chat: another chat is another page, not new props. */
export function ChatView() {
  const { chatId } = useParams({ strict: false })
  useRouteTab('view:chats')
  return <ChatPage key={chatId ?? 'new'} chatId={chatId} />
}
