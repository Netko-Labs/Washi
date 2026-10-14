import { Mascot } from '../mascot'
import { useAgentStore } from '../stores'
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
            Pick one and Washi designs it. You approve before anything is saved.
          </p>
        </div>
      </div>
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
