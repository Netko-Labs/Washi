import { AgentMascot, useAgentStore, useSheetsStore } from '@washi/ui'
import { STATE_LABEL } from '@/components/agent-status'
import { type AskFieldProps, TINT, useAskMood } from './lib'

/** The door: text finds a page or asks Washi (⌘K), the face is Washi's state, and it opens the panel (⌘J). */
export function AskField({ onNavigate, scoped = false }: AskFieldProps) {
  const { mascot, status, tint } = useAskMood()
  const title = status ? STATE_LABEL[status.state] : 'Washi'

  return (
    <div
      className={`flex h-11 items-center gap-2 rounded-[9px] border border-border bg-card pr-2 pl-1.5 text-[14px] text-muted-foreground md:h-[34px] md:text-[12.5px] ${TINT[tint]}`}
    >
      <button
        type="button"
        onClick={() => {
          useAgentStore.getState().togglePanel()
          onNavigate()
        }}
        aria-label="Open Washi"
        title={`${title} — open the panel (⌘J)`}
        className="grid size-6 shrink-0 place-items-center rounded-md hover:bg-accent"
      >
        <AgentMascot state={mascot} size={20} />
      </button>
      <button
        type="button"
        onClick={() => {
          useSheetsStore.getState().openPalette()
          onNavigate()
        }}
        className="flex h-full min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span className="flex-1 truncate">
          {scoped ? 'Ask Washi about this page' : 'Ask Washi or search'}
        </span>
        <kbd className="hidden rounded bg-accent px-1 py-0.5 font-sans text-[10px] md:inline">
          ⌘K
        </kbd>
      </button>
    </div>
  )
}
