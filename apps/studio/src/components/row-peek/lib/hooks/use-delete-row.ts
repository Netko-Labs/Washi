import { useNoticeStore } from '@washi/ui'
import { api } from '@/integrations/trpc'

/**
 * Deletes the row behind a page — the same `table.delete` a database view runs, which trashes its
 * page too. Read at the press, not before: the peek holds only the page's id. True once it is gone.
 */
export function useDeleteRow() {
  return async (sheetId: string): Promise<boolean> => {
    try {
      const rowOf = await api.tables.rowOf.query({ sheetId })
      if (!rowOf) {
        useNoticeStore.getState().say('This page is no longer a row — nothing to delete')
        return false
      }
      await api.capabilities.runAction.mutate({
        action: { verb: 'table.delete', table: rowOf.table.name, row: rowOf.row.id },
      })
      return true
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : String(cause)
      useNoticeStore.getState().say(`That row was not deleted — ${reason}`)
      return false
    }
  }
}
