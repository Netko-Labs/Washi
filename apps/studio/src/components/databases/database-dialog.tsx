import { IconX } from '@tabler/icons-react'
import { PaperProvider, tableLabel, WsxView } from '@washi/paper'
import { paperHost } from '@washi/ui'
import { useMemo } from 'react'
import { Dialog } from '@/components/shared/dialog'
import { type DatabaseDialogProps, databaseRoot } from './lib'

/** A table no page shows, opened on its own: its rows as the Database primitive draws them. */
export function DatabaseDialog({ name, onClose }: DatabaseDialogProps) {
  const root = useMemo(() => databaseRoot(name), [name])
  const title = tableLabel(name)

  return (
    <Dialog label={title} onClose={onClose} width={880}>
      <div className="flex items-center gap-2">
        <h2 className="min-w-0 flex-1 truncate font-semibold text-[15px]">{title}</h2>
        <button
          type="button"
          aria-label="Close"
          title="Close · Esc"
          onClick={onClose}
          className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <IconX className="size-4" />
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto">
        <PaperProvider host={paperHost}>
          <WsxView root={root} />
        </PaperProvider>
      </div>
    </Dialog>
  )
}
