import { IconAlertTriangle } from '@tabler/icons-react'
import { AgentMascot, HandoffDivider, Markdown } from '@washi/ui'
import { ChatPageCard } from './chat-page-card'
import { ChatReceipts } from './chat-receipts'
import type { ChatTurnProps } from './lib'

/** Washi's turn as prose under its mark: words, quiet receipts between them, the pages it wrote. */
export function ChatTurn({ block, workspaceId, isLive, failureId }: ChatTurnProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:gap-4" data-chat-washi>
      <AgentMascot state={isLive ? 'writing' : 'idle'} size={26} className="shrink-0 sm:mt-0.5" />
      <div className="min-w-0 flex-1 break-words text-[15px] leading-[1.75]">
        {block.parts.map((part) => {
          switch (part.kind) {
            case 'text':
              return <Markdown key={part.id} text={part.text} />
            case 'tools':
              return <ChatReceipts key={part.id} steps={part.steps} />
            case 'error':
              // The chat's last failure is drawn under the thread, with Retry (D114).
              return part.id === failureId ? null : (
                <p
                  key={part.id}
                  className="my-1.5 flex items-start gap-1.5 text-[13.5px] text-destructive"
                >
                  <IconAlertTriangle className="mt-1 size-4 shrink-0" />
                  {part.text}
                </p>
              )
            case 'stopped':
              return (
                <p key={part.id} className="my-1.5 text-[13px] text-muted-foreground">
                  Stopped
                </p>
              )
            case 'handoff':
              return <HandoffDivider key={part.id} handoff={part.handoff} />
            default:
              return null
          }
        })}
        {block.pages.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {block.pages.map((page) => (
              <ChatPageCard key={page.id} page={page} workspaceId={workspaceId} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
