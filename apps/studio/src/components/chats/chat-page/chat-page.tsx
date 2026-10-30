import { getRouteApi } from '@tanstack/react-router'
import { useComposer } from '@washi/ui'
import { type ChatPageProps, useChatRoute } from '../lib'
import { ChatBar } from './chat-bar'
import { ChatBody } from './chat-body'
import { ChatMissing } from './chat-missing'

const workspaceRoute = getRouteApi('/w/$workspaceId')

/** A chat as a page (D67, D111): one reading column, the composer under it. */
export function ChatPage({ chatId }: ChatPageProps) {
  const { workspaceId } = workspaceRoute.useParams()
  const { isMissing } = useChatRoute(workspaceId, chatId)
  const composer = useComposer()

  if (isMissing) return <ChatMissing workspaceId={workspaceId} />
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <ChatBar workspaceId={workspaceId} chatId={chatId} />
      <ChatBody workspaceId={workspaceId} composer={composer} isNew={!chatId} />
    </div>
  )
}
