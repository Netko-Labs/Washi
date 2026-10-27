import { useData } from '../../../../data'
import { usePaperHost } from '../../../../provider'
import type { ColumnSpec } from '../types'
import { DEFAULT_STATUS_GROUPS } from '../values'

/** New rows, new properties, and opening a row as its page. */
export function useRowActions(table: string) {
  const host = usePaperHost()
  const { refresh } = useData()

  const run = async (action: Parameters<typeof host.runAction>[0]) => {
    try {
      await host.runAction(action)
    } finally {
      refresh()
    }
  }

  return {
    canOpen: Boolean(host.openRow),
    open: (id: string) => host.openRow?.(id),
    addRow: async (data: Record<string, string>) => {
      if (!host.newRow) return run({ verb: 'table.insert', table, data })
      try {
        await host.newRow(table, data)
      } finally {
        refresh()
      }
    },
    addProperty: (name: string, type: ColumnSpec['type'], options: string[]) =>
      run({
        verb: 'table.column',
        table,
        column: {
          name,
          type,
          ...((type === 'select' || type === 'multi_select') && { options }),
          ...(type === 'status' && { groups: DEFAULT_STATUS_GROUPS }),
        },
      }),
  }
}
