import { useData } from '../../../../data'
import { usePaperHost } from '../../../../provider'
import type { ColumnSpec } from '../types'
import { propertyColumn } from '../utils'

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
    /** A link adds no rows here; a view is not one of the adds a link may suggest (D120). */
    canAdd: !host.isReadOnly,
    open: (id: string) => host.openRow?.(id),
    addRow: async (data: Record<string, string>) => {
      if (!host.newRow) return run({ verb: 'table.insert', table, data })
      try {
        await host.newRow(table, data)
      } finally {
        refresh()
      }
    },
    addProperty: (name: string, type: ColumnSpec['type'], options: string[], format?: string) =>
      run({ verb: 'table.column', table, column: propertyColumn(name, type, options, format) }),
  }
}
