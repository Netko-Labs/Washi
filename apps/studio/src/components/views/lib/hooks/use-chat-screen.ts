import { useAgentStore } from '@washi/ui'
import { titleIn } from '../utils'
import { NEW_CHAT_TITLE } from '../values'
import { useScreen } from './use-screen'

/** `/chats/new` has no chat yet; a chat's title arrives with the session list. */
export function useChatScreen(chatId: string | undefined): void {
  const chat = useAgentStore((state) => (chatId ? titleIn(state.sessions, chatId) : NEW_CHAT_TITLE))
  useScreen('view:chats', [chat])
}
