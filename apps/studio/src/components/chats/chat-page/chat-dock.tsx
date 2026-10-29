import { ChatComposer } from './chat-composer'
import type { ChatDockProps } from './lib'

/** The composer pinned under the column; the fade lets the conversation scroll beneath it. */
export function ChatDock({ composer }: ChatDockProps) {
  return (
    <div className="relative shrink-0 px-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-full h-10 bg-gradient-to-t from-background to-transparent"
      />
      <div className="mx-auto w-full max-w-[768px]">
        <ChatComposer composer={composer} />
      </div>
    </div>
  )
}
