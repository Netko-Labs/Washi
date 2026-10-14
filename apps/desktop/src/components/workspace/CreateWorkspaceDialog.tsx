import { IconFolder } from '@tabler/icons-react'
import { VAULT_TOPIC_ORDER, VaultIcon } from '@washi/ui'
import { useState } from 'react'

const VAULT_CHOICES = VAULT_TOPIC_ORDER

const SYNC_NOTES = {
  local: 'Files stay in this folder. You can connect it to your server later.',
  server: 'Members of this server can be invited once the vault exists.',
} as const

export function CreateWorkspaceDialog({ onClose }: { onClose: () => void }) {
  const [vault, setVault] = useState('ideas')
  const [sync, setSync] = useState<keyof typeof SYNC_NOTES>('local')

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/50 pt-[12vh]">
      <div className="w-[460px] max-w-[92vw] overflow-hidden rounded-[14px] border border-border bg-popover text-popover-foreground shadow-[0_16px_48px_rgba(0,0,0,0.28)]">
        <div className="border-border border-b px-5 pt-[18px] pb-3.5">
          <div className="font-semibold text-[15px] tracking-[-0.01em]">Create workspace</div>
          <div className="mt-0.5 text-muted-foreground text-xs">
            A workspace is one folder of plain files on this device.
          </div>
        </div>

        <div className="flex flex-col gap-4 px-5 pt-4 pb-[18px]">
          <label className="flex flex-col gap-1.5">
            <span className="font-medium text-xs">Name</span>
            <input
              placeholder="Client work"
              className="h-[34px] rounded-[10px] border border-input bg-background px-2.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus:border-muted-foreground"
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="font-medium text-xs">Vault icon</span>
            <div className="flex flex-wrap gap-2">
              {VAULT_CHOICES.map((topic) => (
                <button
                  type="button"
                  key={topic}
                  onClick={() => setVault(topic)}
                  className={`rounded-xl border-2 p-[3px] leading-none ${
                    vault === topic ? 'border-foreground' : 'border-transparent'
                  }`}
                >
                  <VaultIcon topic={topic} size={34} className="rounded-[9px]" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-medium text-xs">Location</span>
            <div className="flex h-[34px] items-center gap-2 rounded-[10px] border border-input bg-muted px-2.5 font-mono text-[12.5px] text-muted-foreground">
              <IconFolder className="size-3.5 flex-none" />
              <span className="min-w-0 flex-1 truncate">~/Washi/new-vault</span>
              <span className="cursor-pointer font-medium font-sans text-foreground">Change</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-medium text-xs">Sync</span>
            <div className="flex overflow-hidden rounded-[10px] border border-border">
              <button
                type="button"
                onClick={() => setSync('local')}
                className={`h-[34px] flex-1 text-[12.5px] ${
                  sync === 'local'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground'
                }`}
              >
                This device only
              </button>
              <button
                type="button"
                onClick={() => setSync('server')}
                className={`h-[34px] flex-1 border-border border-l text-[12.5px] ${
                  sync === 'server'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground'
                }`}
              >
                sync.hollowmoor.net
              </button>
            </div>
            <span className="text-[11.5px] text-muted-foreground">{SYNC_NOTES[sync]}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 border-border border-t bg-muted px-5 py-3">
          <span className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-[10px] border border-border bg-background px-3 text-[13px] text-foreground hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-[10px] bg-primary px-3.5 font-medium text-[13px] text-primary-foreground hover:opacity-90"
          >
            Create workspace
          </button>
        </div>
      </div>
    </div>
  )
}
