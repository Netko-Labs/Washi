import { IconCheck, IconPlus, IconSelector } from '@tabler/icons-react'
import { useState } from 'react'
import { VaultIcon } from '@/components/mascot/VaultIcon'
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog'

export function WorkspaceSwitcher({ pages }: { pages: number }) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  return (
    <div className="relative px-2 pt-1.5 pb-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-2 rounded-[10px] p-1.5 text-left hover:bg-accent ${
          open ? 'bg-accent' : ''
        }`}
      >
        <VaultIcon topic="journal" size={26} className="flex-none rounded-lg" />
        <span className="min-w-0">
          <span className="block truncate font-semibold text-[13px] tracking-[-0.01em]">
            Personal vault
          </span>
          <span className="block text-[11px] text-muted-foreground">{pages} pages · local</span>
        </span>
        <span className="ml-auto flex opacity-50">
          <IconSelector className="size-3.5" />
        </span>
      </button>

      {open && (
        <div className="absolute inset-x-2 top-12 z-[70] rounded-xl border border-border bg-popover p-[5px] shadow-[0_8px_28px_rgba(0,0,0,0.16)]">
          <div className="px-2 pt-1.5 pb-[3px] font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
            Workspaces
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-[34px] w-full items-center gap-[9px] rounded-lg px-2 text-left text-[13px] hover:bg-accent"
          >
            <VaultIcon topic="journal" size={20} className="flex-none rounded-md" />
            <span className="min-w-0 flex-1 truncate">Personal vault</span>
            <IconCheck className="size-3.5" />
          </button>
          <button
            type="button"
            className="flex h-[34px] w-full items-center gap-[9px] rounded-lg px-2 text-left text-[13px] hover:bg-accent"
          >
            <VaultIcon topic="work" size={20} className="flex-none rounded-md" />
            <span className="min-w-0 flex-1 truncate">Client work</span>
          </button>
          <div className="mx-1 my-[5px] h-px bg-border" />
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setCreating(true)
            }}
            className="flex h-8 w-full items-center gap-[9px] rounded-lg px-2 text-left text-[13px] text-muted-foreground hover:bg-accent"
          >
            <IconPlus className="size-3.5" />
            Create workspace
          </button>
        </div>
      )}

      {creating && <CreateWorkspaceDialog onClose={() => setCreating(false)} />}
    </div>
  )
}
