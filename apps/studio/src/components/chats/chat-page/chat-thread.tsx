import { IconArrowDown } from '@tabler/icons-react'
import { ApprovalCard, TurnStatus, useAgentStore } from '@washi/ui'
import { ChatPerson } from './chat-person'
import { ChatTurn } from './chat-turn'
import { type ChatThreadProps, useChatThread } from './lib'

/** The conversation in one reading column; it follows the end unless the reader scrolled away. */
export function ChatThread({ workspaceId }: ChatThreadProps) {
  const { blocks, asks, turn, endId, stick } = useChatThread()
  const last = blocks.at(-1)

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={stick.scrollRef}
        onScroll={stick.onScroll}
        className="h-full overflow-y-auto overflow-x-hidden overscroll-y-contain"
      >
        <div className="mx-auto flex w-full max-w-[768px] flex-col gap-7 px-4 pt-6 pb-16 sm:px-6 md:pt-10">
          {blocks.map((block, index) =>
            block.kind === 'person' ? (
              <ChatPerson key={block.id} block={block} />
            ) : (
              <ChatTurn
                key={block.id}
                block={block}
                workspaceId={workspaceId}
                isLive={turn === 'working' && index === blocks.length - 1}
                endId={endId}
              />
            ),
          )}
          <TurnStatus variant="page" mark={last?.kind !== 'washi'} />
          {asks.map((request) => (
            <div key={request.id} className="sm:pl-[42px]" data-approval-inline>
              <ApprovalCard
                toolName={request.toolName}
                input={request.input}
                onDecide={(decision) =>
                  useAgentStore.getState().resolveApproval(request.id, decision)
                }
              />
            </div>
          ))}
        </div>
      </div>
      {stick.hasNew && (
        <button
          type="button"
          onClick={stick.jump}
          className="-translate-x-1/2 absolute bottom-4 left-1/2 flex h-11 items-center gap-1.5 rounded-full border border-border bg-card px-4 font-medium text-[13px] shadow-[0_6px_20px_rgb(0_0_0/0.14)] hover:bg-accent md:h-9"
        >
          <IconArrowDown className="size-4" />
          New
        </button>
      )}
    </div>
  )
}
