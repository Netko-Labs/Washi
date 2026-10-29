import { useParams } from '@tanstack/react-router'
import { ChatPage } from '@/components/chats'
import { useChatScreen } from './lib'

/** `/chats/new` has no id. Keyed by chat: another chat is another page, not new props. */
export function ChatView() {
  const { chatId } = useParams({ strict: false })
  useChatScreen(chatId)
  return <ChatPage key={chatId ?? 'new'} chatId={chatId} />
}
