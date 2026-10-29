import {
  IconArrowsDiagonal,
  IconChevronDown,
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
  IconPlus,
  IconX,
} from '@tabler/icons-react'
import { useState } from 'react'
import { AgentMascot } from '../mascot'
import { shownScope, useAgentStore } from '../stores'
import { ConversationsMenu } from './conversations-menu'
import type { PanelHeaderProps } from './lib'
import { ScopeChip } from './scope-chip'

const HEADER_BUTTON =
  'grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground'

/** The chat's title over its place (D110); either opens this place's conversations. */
export function PanelHeader({ placement, onExpand, title, mascotState }: PanelHeaderProps) {
  const scope = useAgentStore(shownScope)
  const [isMenuOpen, setMenuOpen] = useState(false)
  const store = useAgentStore.getState

  return (
    <div className="relative flex h-[50px] shrink-0 items-center gap-0.5 border-border border-b pr-2 pl-3.5">
      <AgentMascot state={mascotState} size={26} />
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        className="-ml-1 flex h-[34px] min-w-0 items-center gap-1.5 rounded-[9px] px-2 text-left hover:bg-accent"
      >
        <span className="min-w-0">
          <span className="block truncate font-medium text-[13px]">{title}</span>
          <ScopeChip sheetId={scope} />
        </span>
        <IconChevronDown className="size-[13px] shrink-0 text-muted-foreground" />
      </button>
      <div className="ml-auto flex gap-0.5">
        <button
          type="button"
          aria-label="New chat here"
          title="New chat here"
          onClick={() => store().startDraft()}
          className={HEADER_BUTTON}
        >
          <IconPlus className="size-[15px]" />
        </button>
        {onExpand && placement !== 'page' && (
          <button
            type="button"
            aria-label="Open the chat as a page"
            title="Open as a page"
            onClick={onExpand}
            className={HEADER_BUTTON}
          >
            <IconArrowsDiagonal className="size-[15px]" />
          </button>
        )}
        {(placement === 'float' || placement === 'dock') && (
          <button
            type="button"
            aria-label={placement === 'dock' ? 'Float the panel' : 'Dock the panel beside the page'}
            title={placement === 'dock' ? 'Float' : 'Dock to the side'}
            onClick={() => store().toggleDocked()}
            className={HEADER_BUTTON}
          >
            {placement === 'dock' ? (
              <IconLayoutSidebarRightCollapse className="size-[15px]" />
            ) : (
              <IconLayoutSidebarRightExpand className="size-[15px]" />
            )}
          </button>
        )}
        {placement !== 'page' && (
          <button
            type="button"
            aria-label="Close agent panel"
            onClick={() => store().togglePanel()}
            className={HEADER_BUTTON}
          >
            <IconX className="size-[15px]" />
          </button>
        )}
      </div>
      {isMenuOpen && <ConversationsMenu onClose={() => setMenuOpen(false)} />}
    </div>
  )
}
