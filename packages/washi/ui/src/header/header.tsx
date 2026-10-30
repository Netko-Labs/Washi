import { AgentMascot } from '../mascot'
import { HeaderCrumbs } from './header-crumbs'
import { type HeaderProps, STATE_LABELS, useAgentPill } from './lib'

/** 48px header: breadcrumb + agent status pill (Washi.dc.html rev 2 — no bot button, FAB rules). */
export function Header({ leading, actions, starInActions }: HeaderProps) {
  const pill = useAgentPill()

  return (
    <header className="@container flex h-12 shrink-0 items-center gap-2.5 border-border border-b px-4">
      {leading}
      <HeaderCrumbs starInActions={starInActions} />
      <div className="ml-auto flex flex-none items-center gap-1.5">
        {pill && (
          <div
            className="hidden h-[26px] items-center gap-1.5 rounded-full border border-agent border-dashed @xl:flex px-2.5 text-[12px] text-muted-foreground"
            data-agent-pill
          >
            <AgentMascot state={pill} size={17} />
            {STATE_LABELS[pill]}
          </div>
        )}
        {actions}
      </div>
    </header>
  )
}
