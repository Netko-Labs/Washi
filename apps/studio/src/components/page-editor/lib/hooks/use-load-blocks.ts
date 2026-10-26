import type { SheetDetail } from '@washi/domain'
import { parse, type WsxElement } from '@washi/wsx'
import { useEffect } from 'react'
import { api } from '@/integrations/trpc'
import { useEditorStore } from '../editor-store'
import type { TableRef } from '../types'
import { sourceOver, toBlocks } from '../utils'

/**
 * Once per page; after that, only an edit that came from someone else — a teammate's save, or
 * Washi's — is taken in, and only while this editor has nothing of its own still unsaved.
 */
export function useLoadBlocks(sheet: SheetDetail, root: WsxElement) {
  useEffect(() => {
    useEditorStore.getState().load(toBlocks(root), sheet.version ?? null, sheet.source)
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
  }, [sheet.id])

  useEffect(() => {
    const editor = useEditorStore.getState()
    if (sheet.source === editor.savedSource || editor.saveState === 'saving') return
    // Typing not yet saved stays: the next save sends its version and the server merges both.
    const base = editor.savedSource
    if (base && sourceOver(base, editor.blocks) !== base) return
    editor.absorb(toBlocks(parse(sheet.source)), sheet.version ?? null, sheet.source)
  }, [sheet.source])
}
