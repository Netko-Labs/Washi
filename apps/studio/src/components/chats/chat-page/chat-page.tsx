import { getRouteApi } from '@tanstack/react-router'
import { useComposer } from '@washi/ui'
import { type ChatPageProps, useChatRoute } from '../lib'
import { ChatBar } from './chat-bar'
import { ChatBody } from './chat-body'

const workspaceRoute = getRouteApi('/w/$workspaceId')

/** A chat as a page (D67, D111): one reading column, the composer under it. */
export function ChatPage({ chatId }: ChatPageProps) {
  const { workspaceId } = workspaceRoute.useParams()
  const { isMissing } = useChatRoute(workspaceId, chatId)
  const composer = useComposer()

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <ChatBar workspaceId={workspaceId} chatId={chatId} />
      {isMissing ? (
        <p className="mt-16 text-center text-[14px] text-muted-foreground">
          This chat is gone, or it is someone else's.
        </p>
      ) : (
        <ChatBody workspaceId={workspaceId} composer={composer} isNew={!chatId} />
      )}
    </div>
  )
}
