import { useState } from 'react'
import { useData } from '../../../../data'
import { usePaperHost } from '../../../../provider'
import type { ColumnChange, PropertyStatus } from '../types'

/** One column-menu change through the host; refused in the server's own words. */
export function useColumnChange() {
  const host = usePaperHost()
  const { refresh } = useData()
  const [status, setStatus] = useState<PropertyStatus>({ busy: false, error: null })

  const run = async (change: ColumnChange): Promise<boolean> => {
    if (!host.changeColumn) return false
    setStatus({ busy: true, error: null })
    try {
      await host.changeColumn(change)
      setStatus({ busy: false, error: null })
      return true
    } catch (cause) {
      setStatus({ busy: false, error: cause instanceof Error ? cause.message : String(cause) })
      return false
    } finally {
      refresh()
    }
  }

  return { status, run }
}
