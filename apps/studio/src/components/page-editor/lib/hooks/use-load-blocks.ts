import type { WsxElement } from '@washi/wsx'
import { useEffect } from 'react'
import { api } from '@/integrations/trpc'
import { useEditorStore } from '../editor-store'
import type { TableRef } from '../types'
import { toBlocks } from '../utils'

/** Once per page: later versions of the page are the editor's own saves coming back. */
export function useLoadBlocks(sheetId: string, root: WsxElement) {
  useEffect(() => {
    useEditorStore.getState().load(toBlocks(root))
    // The `/` menu offers every table; a failed list only means fewer options.
    api.tables.list
      .query()
      .then((tables) =>
        useEditorStore.getState().setTables(
          tables.map(({ spec }): TableRef => {
            const status = spec.columns.find((column) => column.type === 'status')
            const values = status?.groups?.done ?? []
            return {
              name: spec.name,
              done: status && values.length > 0 ? { column: status.name, values } : null,
            }
          }),
        ),
      )
      .catch(() => undefined)
  }, [sheetId])
}
