import { IconChevronDown } from '@tabler/icons-react'
import { VaultIcon } from '@washi/ui'
import { useRef, useState } from 'react'
import { useDismiss } from '@/components/shared/dismiss'
import { topicFor } from '@/components/workspace'
import type { WorkspaceSwitcherProps } from './lib'
import { WorkspaceMenu } from './workspace-menu'

/** The workspace name, in the footer, opens every other workspace — no trip back through the picker. */
export function WorkspaceSwitcher({ workspace, onNavigate }: WorkspaceSwitcherProps) {
  const [isOpen, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useDismiss(root, isOpen, () => setOpen(false))

  return (
    <div ref={root} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title="Switch workspace"
        className={`flex h-8 w-full items-center gap-2 rounded-lg px-1.5 text-left hover:bg-accent ${
          isOpen ? 'bg-accent' : ''
        }`}
      >
        <VaultIcon topic={topicFor(workspace.id)} size={20} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate font-semibold text-[13px]">{workspace.name}</span>
        <IconChevronDown className="size-3 shrink-0 text-muted-foreground" />
      </button>
      {isOpen && (
        <WorkspaceMenu
          currentId={workspace.id}
          onClose={() => {
            setOpen(false)
            onNavigate()
          }}
        />
      )}
    </div>
  )
}
