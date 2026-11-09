import { useState } from 'react'
import { useData } from '../../../../data'
import { usePaperHost } from '../../../../provider'
import type { EventWrite, EventWriteStatus } from '../types'

/**
 * The event's card writes through the page's own action path, as a cell does: `table.update` for
 * its time and properties, `table.delete` for Delete (its page goes to the Trash). A refusal stays
 * on the card in the host's words; a delete that landed calls `onDeleted`.
 */
export function useEventWrite(table: string, id: string, onDeleted: () => void): EventWrite {
  const host = usePaperHost()
  const { refresh } = useData()
  const [status, setStatus] = useState<EventWriteStatus>({ kind: 'idle' })

  const run = async (act: () => Promise<void>) => {
    setStatus({ kind: 'busy' })
    try {
      await act()
      setStatus({ kind: 'idle' })
    } catch (cause) {
      setStatus({ kind: 'refused', reason: cause instanceof Error ? cause.message : String(cause) })
      throw cause
    } finally {
      refresh()
    }
  }

  return {
    status,
    write: (set) =>
      run(() => host.runAction({ verb: 'table.update', table, row: id, set })).catch(() => {}),
    remove: () =>
      run(() => host.runAction({ verb: 'table.delete', table, row: id })).then(onDeleted, () => {}),
  }
}
