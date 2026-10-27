import { IconChevronLeft } from '@tabler/icons-react'
import { getRouteApi, Link } from '@tanstack/react-router'
import { AgentPanel } from '@washi/ui'
import { type ChatPageProps, useChatRoute } from './lib'

const workspaceRoute = getRouteApi('/w/$workspaceId')

/** A chat as a page (D67): the same panel, given the whole column. */
export function ChatPage({ chatId }: ChatPageProps) {
  const { workspaceId } = workspaceRoute.useParams()
  const { isMissing } = useChatRoute(workspaceId, chatId)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto flex min-h-0 w-full max-w-[820px] flex-1 flex-col px-4 pb-4">
        <Link
          to="/w/$workspaceId/chats"
          params={{ workspaceId }}
          className="mb-2 flex h-8 w-fit items-center gap-1 rounded-lg px-2 text-[12.5px] text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <IconChevronLeft className="size-4" />
          All chats
        </Link>
        {isMissing ? (
          <p className="mt-16 text-center text-[13px] text-muted-foreground">
            This chat is gone, or it is someone else's.
          </p>
        ) : (
          <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-border">
            <AgentPanel placement="page" />
          </div>
        )}
      </div>
    </div>
  )
}
