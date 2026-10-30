import { useState } from 'react'
import { useData } from '../../../../data'
import { usePaperHost } from '../../../../provider'
import type { EventCopy, EventCopyStatus } from '../types'
import { copyAction } from '../utils'

/**
 * Copies the event's row through the host — one `table.copy`, signed as the presser, every copy
 * or none. A refusal stays on screen in the host's words; a copy that landed calls `onCopied`.
 */
export function useEventCopy(table: string, id: string, onCopied: () => void): EventCopy {
  const host = usePaperHost()
  const { refresh } = useData()
  const [status, setStatus] = useState<EventCopyStatus>({ kind: 'idle' })

  return {
    status,
    copy: async (entries) => {
      setStatus({ kind: 'busy' })
      try {
        const spec = await host.describeTable(table).catch(() => null)
        await host.runAction(copyAction(table, id, entries, spec))
        setStatus({ kind: 'idle' })
        onCopied()
      } catch (cause) {
        setStatus({
          kind: 'refused',
          reason: cause instanceof Error ? cause.message : String(cause),
        })
      } finally {
        refresh()
      }
    },
  }
}
