import { AgentMascot } from '../mascot'
import { noteIdOf, useSheetsStore, useViewStore } from '../stores'
import type { EmptyChatProps } from './lib'

export function EmptyChat({ onStarter }: EmptyChatProps) {
  const identity = useViewStore((state) => state.identity)
  const sheets = useSheetsStore((state) => state.sheets)
  const pageId = useViewStore((state) => noteIdOf(state.activeTab))
  const leaf = sheets.find((sheet) => sheet.id === pageId)?.title ?? 'this workspace'
  const firstName = identity.name.trim().split(/\s+/)[0] || 'there'

  const starters = [
    `Summarize ${leaf}`,
    'Find contradictions with other pages',
    'Tighten the intro paragraph',
  ]

  return (
    <div className="flex flex-col gap-3 px-4 pt-[18px] pb-2">
      <AgentMascot state="idle" size={52} />
      <div className="font-semibold text-[15px] tracking-[-0.01em]">Hi {firstName}</div>
      <p className="text-[12.5px] text-muted-foreground leading-relaxed">
        I'm watching {leaf}. Ask me anything, or start from one of these:
      </p>
      {starters.map((starter) => (
        <button
          key={starter}
          type="button"
          onClick={() => onStarter(starter)}
          className="w-full rounded-[11px] border border-border bg-background px-[11px] py-[9px] text-left text-[12.5px] hover:bg-accent"
        >
          {starter}
        </button>
      ))}
      <div className="text-[11px] text-muted-foreground">
        Toggle anytime with{' '}
        <span className="inline-flex h-[18px] items-center rounded-[5px] border border-border bg-muted px-[5px] font-mono text-[10.5px]">
          ⌘J
        </span>
      </div>
    </div>
  )
}
