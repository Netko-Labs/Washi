import type { SheetDetail } from '@washi/domain'
import { useEffect } from 'react'
import { useEditorStore } from '../../../lib'
import { useSourceStore } from '../source-store'

/** Loads once per page; later sources (a teammate's save, Washi's) land only over an unchanged draft. */
export function useSourceLoad(sheet: SheetDetail) {
  useEffect(() => {
    useSourceStore.getState().load(sheet.source, sheet.version ?? null)
  }, [sheet.id])

  useEffect(() => {
    const source = useSourceStore.getState()
    if (sheet.source === source.savedSource) return
    if (useEditorStore.getState().saveState === 'saving') return
    // A draft not yet saved stays: its save sends its version and the server merges both.
    if (source.draft !== source.savedSource) return
    source.absorb(sheet.source, sheet.version ?? null)
  }, [sheet.source])
}
