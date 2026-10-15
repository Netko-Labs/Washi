import type { PaperHost } from '@washi/paper'
import { useMemo } from 'react'
import { paperHost } from '../../../paper-host'
import { noteIdOf, useSheetsStore, useViewStore } from '../../../stores'
import type { PageSheet } from '../types'
import { replaceInSheet } from '../utils'
import { useSheet } from './use-sheet'

/** The open page, and a host that can write parts of it back — what a hand-drawn canvas needs. */
export function usePageSheet(): PageSheet {
  const pageId = useViewStore((state) => noteIdOf(state.activeTab))
  const summary = useSheetsStore((state) => state.sheets.find((sheet) => sheet.id === pageId))
  const state = useSheet(pageId, summary?.hlcUpdated)

  const host = useMemo<PaperHost>(
    () =>
      state.status === 'ready'
        ? {
            ...paperHost,
            replaceNode: (from, to) => replaceInSheet(state.sheet, state.root, from, to),
          }
        : paperHost,
    [state],
  )

  return { summary, state, host }
}
