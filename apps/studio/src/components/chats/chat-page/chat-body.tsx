import { useAgentStore } from '@washi/ui'
import { ChatDock } from './chat-dock'
import { ChatEmpty } from './chat-empty'
import { ChatThread } from './chat-thread'
import type { ChatBodyProps } from './lib'

/** A new chat waits mid-screen; from the first send on, the composer sits under the thread. */
export function ChatBody({ workspaceId, composer, isNew }: ChatBodyProps) {
  const isEmpty = useAgentStore((state) => state.transcript.length === 0 && !state.running)
  if (isNew && isEmpty) return <ChatEmpty composer={composer} />
  return (
    <>
      <ChatThread workspaceId={workspaceId} />
      <ChatDock composer={composer} />
    </>
  )
}
