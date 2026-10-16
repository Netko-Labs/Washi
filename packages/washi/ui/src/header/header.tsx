import { AgentMascot } from '../mascot'
import { useViewStore, viewOf } from '../stores'
import { HeaderCrumbs } from './header-crumbs'
import { type HeaderProps, STATE_LABELS, useAgentMood } from './lib'

/** 48px header: breadcrumb + agent status pill (Washi.dc.html rev 2 — no bot button, FAB rules). */
export function Header({ leading, actions }: HeaderProps) {
  const isNote = useViewStore((state) => viewOf(state.activeTab) === 'note')
  const mascotState = useAgentMood()

  return (
    <header className="@container flex h-12 shrink-0 items-center gap-2.5 border-border border-b px-4">
      {leading}
      <HeaderCrumbs />
      <div className="ml-auto flex flex-none items-center gap-1.5">
        {isNote && (
          <div
            className="hidden h-[26px] items-center gap-1.5 rounded-full border border-agent border-dashed @xl:flex px-2.5 text-[12px] text-muted-foreground"
            data-agent-pill
          >
            <AgentMascot state={mascotState} size={17} />
            {STATE_LABELS[mascotState]}
          </div>
        )}
        {actions}
      </div>
    </header>
  )
}
