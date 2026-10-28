import type { PaperHost } from '@washi/paper'
import { useMemo } from 'react'
import { paperHost } from '../../../paper-host'
import { noteIdOf, useSheetsStore, useViewStore } from '../../../stores'
import type { PageSheet } from '../types'
import { pageWriter } from '../utils'
import { useSheet } from './use-sheet'

/** The open page (or `sheetId`), and a host that can write parts of it back — what a canvas needs. */
export function usePageSheet(sheetId?: string): PageSheet {
  const activeId = useViewStore((state) => noteIdOf(state.activeTab))
  const pageId = sheetId ?? activeId
  const summary = useSheetsStore((state) => state.sheets.find((sheet) => sheet.id === pageId))
  const state = useSheet(pageId, summary?.hlcUpdated)

  const host = useMemo<PaperHost>(
    () =>
      state.status === 'ready'
        ? {
            ...paperHost,
            pageId: state.sheet.id,
            replaceNode: pageWriter(state.sheet, state.root),
          }
        : paperHost,
    [state],
  )

  return { summary, state, host }
}
