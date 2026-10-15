import { Mascot } from '../mascot'
import { useAgentStore, useNoticeStore, useSheetsStore } from '../stores'
import { STARTERS } from './lib'

/** An empty workspace gets somewhere to begin, not a row of zeros. */
export function StartHere() {
  const ask = (prompt: string) => {
    const agent = useAgentStore.getState()
    if (!agent.panelOpen) agent.togglePanel()
    void agent.sendPrompt(prompt)
  }

  return (
    <div className="mb-[30px] rounded-[14px] border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <Mascot face="happy" motion="bob" size={44} className="mascot-motion" />
        <div>
          <div className="font-semibold text-[15px]">Start with a page</div>
          <p className="text-[13px] text-muted-foreground">
            Pick one and Washi writes it. Its writes are marked, and Undo takes them back.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() =>
          void useSheetsStore
            .getState()
            .seedTeamSpace()
            .catch((cause: unknown) =>
              useNoticeStore.getState().say(cause instanceof Error ? cause.message : String(cause)),
            )
        }
        className="mb-2.5 flex w-full flex-col items-start gap-1 rounded-xl border border-primary/40 bg-background p-3.5 text-left hover:border-primary"
        data-team-space
      >
        <span className="font-medium text-[13.5px]">Set up a team space</span>
        <span className="text-[12px] text-muted-foreground leading-snug">
          A backlog, a roadmap, a wiki, an ideas canvas and a weekly review Washi keeps current.
        </span>
      </button>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {STARTERS.map(({ icon: Icon, title, prompt }) => (
          <button
            key={title}
            type="button"
            onClick={() => ask(prompt)}
            className="flex flex-col items-start gap-1.5 rounded-xl border border-border bg-background p-3.5 text-left hover:border-primary"
          >
            <Icon className="size-[18px] text-primary" />
            <span className="font-medium text-[13.5px]">{title}</span>
            <span className="text-[12px] text-muted-foreground leading-snug">{prompt}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
