import { AgentMascot } from '@washi/ui'
import type { AsleepNoteProps } from './lib'

/** A member's first run: only an owner or admin may give Washi a key, so no form to be refused. */
export function AsleepNote({ workspace, onSkip }: AsleepNoteProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-none">
      <section className="mx-auto max-w-xl px-6 py-16 text-center">
        <AgentMascot state="resting" size={56} className="mx-auto mb-5 block" />
        <p className="font-mono text-[12px] text-muted-foreground">{workspace.name}</p>
        <h1 className="mt-1 font-semibold text-[22px] tracking-[-0.02em]">Washi is asleep</h1>
        <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">
          An owner can give it a key in Settings → Washi. Until then, pages and tables work as
          usual.
        </p>
        <button
          type="button"
          onClick={onSkip}
          className="mt-8 h-11 rounded-xl border border-border px-5 font-semibold text-[13.5px] hover:bg-accent"
        >
          Open the workspace
        </button>
      </section>
    </div>
  )
}
