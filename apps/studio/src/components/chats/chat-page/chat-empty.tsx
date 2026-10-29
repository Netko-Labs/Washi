import { useAgentStore, useViewStore } from '@washi/ui'
import { useRef } from 'react'
import { ChatComposer } from './chat-composer'
import { type ChatEmptyProps, greetingFor, type Starter, useStarters } from './lib'

/** A new chat: the question, the composer mid-screen, and starters read off real pages. */
export function ChatEmpty({ composer }: ChatEmptyProps) {
  const name = useViewStore((state) => state.identity.name)
  const starters = useStarters()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const start = (starter: Starter) => {
    if (starter.sends) {
      void useAgentStore.getState().sendPrompt(starter.prompt, starter.attachments)
      return
    }
    composer.setDraft(starter.prompt)
    inputRef.current?.focus()
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex min-h-full w-full max-w-[768px] flex-col justify-center px-3 pt-10 pb-[max(24px,env(safe-area-inset-bottom))] sm:px-6">
        <h1 className="mb-6 text-balance text-center font-serif text-[26px] leading-tight tracking-[-0.01em] md:mb-8 md:text-[32px]">
          {greetingFor(name)}
        </h1>
        <ChatComposer composer={composer} inputRef={inputRef} />
        <div className="mt-4 flex min-h-11 flex-wrap justify-center gap-2">
          {starters?.map((starter) => (
            <button
              key={starter.label}
              type="button"
              onClick={() => start(starter)}
              className="h-11 max-w-full truncate rounded-full border border-border px-4 text-[13.5px] text-muted-foreground hover:bg-accent hover:text-foreground md:h-9"
            >
              {starter.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
