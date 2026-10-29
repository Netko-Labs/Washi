import { PaperProvider, WsxView } from '@washi/paper'
import { paperHost } from '@washi/ui'
import { useMemo } from 'react'
import { Dialog } from '@/components/shared/dialog'
import { type DatabaseDialogProps, databaseRoot } from './lib'

/** A table no page shows, opened on its own: its rows as the Database primitive draws them. */
export function DatabaseDialog({ name, onClose }: DatabaseDialogProps) {
  const root = useMemo(() => databaseRoot(name), [name])

  return (
    <Dialog label={name} onClose={onClose} width={880}>
      <div className="max-h-[70vh] overflow-y-auto">
        <PaperProvider host={paperHost}>
          <WsxView root={root} />
        </PaperProvider>
      </div>
    </Dialog>
  )
}
